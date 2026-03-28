/**
 * FLL Auth Connector v4.1 — Production
 * OTP disabled — direct password login only
 *
 * Strategy: Intercepts form submission and calls AWS Cognito API
 * No OTP flow — direct token response expected
 *
 * Pages:
 * - /login          → نظام السائقين والمناديب (login via static JS)
 * - /unified-login  → Unified portal (login via React component)
 *
 * v4.1: Updated REDIRECT map to SPA routes + legacy HTML redirect guard
 */

(function() {
  'use strict';

  const API = 'https://qihrv9osed.execute-api.me-south-1.amazonaws.com/prod';

  // Cognito config (same as React SPA)
  const COGNITO_POOL_ID = 'me-south-1_aJtmQ0QrN';
  const COGNITO_CLIENT_ID = '6n49ej8fl92i9rtotbk5o9o0d1';
  const COGNITO_ENDPOINT = 'https://cognito-idp.me-south-1.amazonaws.com/';

  // Role → SPA route mapping
  const REDIRECT = {
    driver:      '/courier/portal',
    staff:       '/admin-panel/dashboard',
    admin:       '/admin-panel/dashboard',
    finance:     '/admin-panel/finance',
    hr:          '/admin-panel/staff',
    ops:         '/admin-panel/dispatch',
    fleet:       '/admin-panel/fleet',
    executive:   '/admin-panel/dashboard',
    SystemAdmin: '/admin-panel/dashboard'
  };

  // Legacy HTML page → SPA route mapping
  // Any direct navigation to these old HTML paths is caught and redirected.
  const LEGACY_HTML_MAP = {
    '/admin-dashboard.html':            '/admin-panel/dashboard',
    '/courier-dashboard.html':          '/courier/portal',
    '/staff-dashboard.html':            '/admin-panel/dashboard',
    '/staff-finance.html':              '/admin-panel/finance',
    '/staff-fleet.html':                '/admin-panel/fleet',
    '/staff-hr.html':                   '/admin-panel/staff',
    '/staff-ops.html':                  '/admin-panel/dispatch',
    '/marketplace-integrations.html':   '/admin-panel/marketplace',
    '/unauthorized.html':               '/unified-login'
  };

  // --- Force full navigation for admin-panel routes only ---
  // Auth routes stay in static site (dark theme), but admin-panel needs SPA.
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (href && href.startsWith('/admin-panel')) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = href;
    }
  }, true);

  // --- Legacy HTML redirect guard (runs immediately) ---
  (function redirectLegacyHTML() {
    var current = window.location.pathname;
    if (LEGACY_HTML_MAP[current]) {
      // Preserve any hash fragment (e.g. admin-dashboard.html#finance)
      var hash = window.location.hash;
      var target = LEGACY_HTML_MAP[current];
      // Map legacy hash anchors to dedicated SPA routes where applicable
      if (current === '/admin-dashboard.html' && hash) {
        var hashMap = {
          '#finance':   '/admin-panel/finance',
          '#staff':     '/admin-panel/staff',
          '#orders':    '/admin-panel/orders',
          '#couriers':  '/admin-panel/couriers'
        };
        if (hashMap[hash]) target = hashMap[hash];
      }
      window.location.replace(target);
    }
  })();

  // --- Session ---
  function saveSession(d) {
    try {
      localStorage.setItem('fll_token', d.token || d.accessToken || '');
      localStorage.setItem('fll_user', JSON.stringify({ username:d.username||'', email:d.email||'', name:d.name||'', groups:d.groups||[] }));
    } catch(e) {}
  }
  function getSession() { try { const u=JSON.parse(localStorage.getItem('fll_user')||'null'), t=localStorage.getItem('fll_token'); return (u&&t)?{...u,token:t}:null; } catch{return null;} }
  function clearSession() { localStorage.removeItem('fll_token'); localStorage.removeItem('fll_user'); }
  function getRedirect(groups) { if(!groups||!groups.length) return '/'; for(const g of groups){if(REDIRECT[g]) return REDIRECT[g];} return '/'; }

  // --- Toast ---
  let _ts=null;
  function showToast(msg, type='info', dur=4000) {
    const o=document.getElementById('fll-toast'); if(o) o.remove();
    if(!_ts){_ts=document.createElement('style');_ts.textContent='@keyframes fti{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fto{from{opacity:1}to{opacity:0;transform:translateX(-50%) translateY(-20px)}}#fll-toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 32px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;font-family:"Segoe UI",Tahoma,sans-serif;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,.3);max-width:90%;text-align:center;animation:fti .3s ease-out}';document.head.appendChild(_ts);}
    const c={success:'#059669',error:'#dc2626',info:'#2563eb',warning:'#d97706'};
    const t=document.createElement('div');t.id='fll-toast';t.style.background=c[type]||c.info;t.textContent=msg;document.body.appendChild(t);
    setTimeout(()=>{t.style.animation='fto .3s ease-in forwards';setTimeout(()=>t.remove(),300);},dur);
  }

  // --- Loading ---
  function setLoad(btn,on){if(!btn)return;if(on){btn._ot=btn.textContent;btn._od=btn.disabled;btn.disabled=true;btn.style.opacity='.7';btn.textContent='جاري المعالجة...';}else{btn.disabled=btn._od||false;btn.style.opacity='1';if(btn._ot)btn.textContent=btn._ot;}}

  // --- API ---
  async function authAPI(ep, data) { try{const r=await fetch(`${API}${ep}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return{ok:r.ok,status:r.status,data:await r.json()};}catch(e){return{ok:false,status:0,data:{message:'خطأ في الاتصال بالخادم'}};} }

  // --- Extract form values ---
  function getVals() {
    const v={};
    document.querySelectorAll('input').forEach(inp => {
      const val=inp.value?.trim(); if(!val) return;
      const t=inp.type||'text', ph=(inp.placeholder||'').trim();
      const lbl=(inp.closest('div')?.querySelector('label')?.textContent||'').trim();
      const ctx=`${lbl} ${ph}`;
      if(t==='password'&&!v.password) v.password=val;
      else if(t==='password') v.confirmPassword=val;
      else if(ctx.includes('البريد')||ctx.includes('email')||t==='email') v.email=val;
      else if(ctx.includes('الهوية')||ctx.includes('المستخدم')||ph==='1234567890') v.username=val;
      else if(ctx.includes('الاسم الكامل')||ctx.includes('أدخل اسمك')) v.fullName=val;
      else if(ctx.includes('الجوال')||t==='tel') v.phone=val;
      else if(!v.username&&t==='text') v.username=val;
    });
    return v;
  }

  function findBtn() {
    for(const b of document.querySelectorAll('button[type="submit"]')){if(b.offsetParent) return b;}
    for(const b of document.querySelectorAll('button')){if((b.textContent.includes('تسجيل')||b.textContent.includes('إنشاء')||b.textContent.includes('دخول'))&&b.offsetParent) return b;}
    return null;
  }

  // ==============================
  // CORE: Intercept alert() 
  // ==============================
  const _alert = window.alert;
  window.alert = function(msg) {
    const p = window.location.pathname;
    if (p==='/login'||p==='/unified-login') {
      if (msg==='تم تسجيل الدخول بنجاح!') { doLogin(p); return; }
      if (msg==='تم إنشاء الحساب بنجاح!') { doRegister(); return; }
    }
    _alert.call(window, msg);
  };

  // --- Cognito Direct Auth (NO OTP) ---
  async function cognitoAuth(email, password) {
    const res = await fetch(COGNITO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password }
      })
    });
    const data = await res.json();
    if (!res.ok) {
      const code = (data.__type || '').split('#').pop();
      const errorMap = {
        'NotAuthorizedException': 'اسم المستخدم أو كلمة المرور غير صحيحة',
        'UserNotFoundException': 'البريد الإلكتروني غير مسجّل في النظام',
        'UserNotConfirmedException': 'يجب تفعيل الحساب — تحقق من بريدك الإلكتروني',
        'LimitExceededException': 'تجاوزت الحد المسموح. انتظر قليلاً وحاول مجدداً',
        'InvalidParameterException': 'البريد الإلكتروني غير صالح'
      };
      return { error: errorMap[code] || data.message || 'خطأ في تسجيل الدخول' };
    }
    return { tokens: data.AuthenticationResult };
  }

  function parseJWT(token) {
    try {
      const b64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(atob(b64));
    } catch { return {}; }
  }

  async function doLogin(page) {
    const v = getVals();
    const id = v.username || v.email || '';
    const pw = v.password || '';
    if (!id||!pw) { showToast('الرجاء إدخال البيانات المطلوبة','error'); return; }

    const btn = findBtn();
    setLoad(btn, true);
    showToast('جاري تسجيل الدخول...','info',10000);

    const result = await cognitoAuth(id, pw);
    setLoad(btn, false);

    if (result.error) {
      showToast(result.error, 'error');
      return;
    }

    // Parse tokens and store temporarily
    const idPayload = parseJWT(result.tokens.IdToken || '');
    const accessPayload = parseJWT(result.tokens.AccessToken || '');
    const groups = accessPayload['cognito:groups'] || [];
    const userName = idPayload['name'] || idPayload['email'] || id;
    const userEmail = idPayload['email'] || id;
    const userSub = idPayload['sub'] || '';
    const role = groups.includes('admin') || groups.includes('SystemAdmin') ? 'admin' : 'staff';

    // Store auth data temporarily (will finalize after OTP)
    window._fllPendingAuth = { tokens: result.tokens, idPayload, accessPayload, groups, userName, userEmail, userSub, role, id };

    // Send OTP to email via Supabase Edge Function
    showToast('تم التحقق! جارٍ إرسال رمز التحقق...', 'success', 3000);
    const SUPABASE_URL = 'https://djebhztfewjfyyoortvv.supabase.co';
    const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NTY5MjcsImV4cCI6MjA1NTIzMjkyN30.NV_wew-RCC45IElUEHnXeQ_86cZdT13';
    try {
      const otpRes = await fetch(`${SUPABASE_URL}/functions/v1/send-otp-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON },
        body: JSON.stringify({ email: userEmail, type: 'login' }),
        signal: AbortSignal.timeout(15000)
      });
      const otpData = await otpRes.json().catch(() => ({}));
      if (!otpRes.ok) console.warn('OTP send response:', otpData);
    } catch(e) {
      console.warn('Edge function OTP failed:', e);
    }

    // Show OTP input UI
    showOTPScreen(userEmail);
  }

  // --- OTP Screen (6-digit boxes) ---
  function showOTPScreen(email) {
    // Find the form container and replace it
    const formContainer = document.querySelector('[class*="login-form"], form, [class*="card"]') ||
      (function() { const cards = document.querySelectorAll('div'); for (const c of cards) { if (c.querySelector('button') && c.querySelector('input') && c.offsetHeight > 200) return c; } return null; })();
    if (!formContainer) { showToast('خطأ في عرض شاشة التحقق', 'error'); return; }

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    formContainer.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="width:56px;height:56px;border-radius:14px;background:rgba(59,130,246,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
        </div>
        <h3 style="font-size:20px;font-weight:700;color:#ffffff;margin:0 0 10px;text-align:center;">التحقق الثنائي</h3>
        <p style="font-size:15px;color:#cbd5e1;margin:0 0 24px;text-align:center;line-height:1.8;">تم إرسال رمز التحقق إلى<br><span style="color:#60a5fa;font-weight:700;font-size:16px;">${maskedEmail}</span></p>

        <div id="fll-otp-boxes" dir="ltr" style="display:flex;justify-content:center;gap:8px;margin-bottom:24px;">
          ${[0,1,2,3,4,5].map(i => `<input id="fll-otp-${i}" type="text" inputmode="numeric" maxlength="1" autocomplete="one-time-code"
            style="width:46px;height:54px;text-align:center;font-size:22px;font-weight:700;
            background:rgba(15,25,40,0.6);border:2px solid rgba(59,130,246,0.3);border-radius:12px;
            color:#e2e8f0;outline:none;transition:border-color 0.2s;"
            onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='rgba(59,130,246,0.3)'">`).join('')}
        </div>

        <button id="fll-otp-verify" style="width:100%;padding:14px;border:none;border-radius:10px;
          background:linear-gradient(135deg,#c9a84c,#b8963f);color:#0b1622;font-size:15px;font-weight:700;
          cursor:pointer;margin-bottom:12px;transition:opacity 0.2s;">
          تحقق
        </button>

        <button id="fll-otp-resend" style="width:100%;padding:12px;border:1px solid rgba(126,140,162,0.3);
          border-radius:10px;background:transparent;color:#7e8ca2;font-size:13px;cursor:pointer;">
          إعادة إرسال الرمز
        </button>

        <p id="fll-otp-error" style="color:#ef4444;font-size:13px;margin-top:12px;display:none;"></p>
      </div>
    `;

    // Auto-focus first box
    setTimeout(() => document.getElementById('fll-otp-0')?.focus(), 100);

    // Handle input navigation between boxes
    for (let i = 0; i < 6; i++) {
      const box = document.getElementById('fll-otp-' + i);
      box.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value && i < 5) document.getElementById('fll-otp-' + (i + 1))?.focus();
        // Auto-submit when all 6 digits entered
        if (i === 5 && this.value) {
          const code = getOTPCode();
          if (code.length === 6) document.getElementById('fll-otp-verify')?.click();
        }
      });
      box.addEventListener('keydown', function(e) {
        if (e.key === 'Backspace' && !this.value && i > 0) {
          document.getElementById('fll-otp-' + (i - 1))?.focus();
        }
      });
      // Handle paste
      box.addEventListener('paste', function(e) {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        for (let j = 0; j < paste.length && j < 6; j++) {
          const b = document.getElementById('fll-otp-' + j);
          if (b) b.value = paste[j];
        }
        if (paste.length >= 6) document.getElementById('fll-otp-verify')?.click();
        else document.getElementById('fll-otp-' + Math.min(paste.length, 5))?.focus();
      });
    }

    // Verify button
    document.getElementById('fll-otp-verify').onclick = async function() {
      const code = getOTPCode();
      if (code.length !== 6) { showOTPError('أدخل رمز التحقق الكامل (6 أرقام)'); return; }
      this.disabled = true; this.textContent = 'جاري التحقق...'; this.style.opacity = '0.7';

      let verified = false;
      const SUPABASE_URL = 'https://djebhztfewjfyyoortvv.supabase.co';
      const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NTY5MjcsImV4cCI6MjA1NTIzMjkyN30.NV_wew-RCC45IElUEHnXeQ_86cZdT13';
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON}`, 'apikey': SUPABASE_ANON },
          body: JSON.stringify({ email: window._fllPendingAuth.userEmail, code, type: 'login' }),
          signal: AbortSignal.timeout(10000)
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && (d.success || d.verified)) verified = true;
        else if (d.error) showOTPError(d.error);
      } catch(e) { console.warn('Verify failed:', e); }

      if (verified) {
        finalizeLogin();
      } else {
        this.disabled = false; this.textContent = 'تحقق'; this.style.opacity = '1';
        showOTPError('رمز التحقق غير صحيح أو منتهي الصلاحية');
      }
    };

    // Resend button
    document.getElementById('fll-otp-resend').onclick = async function() {
      this.disabled = true; this.textContent = 'جاري الإرسال...';
      try {
        await fetch(API + '/auth/send-otp', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: window._fllPendingAuth.userEmail, type: 'login' }),
          signal: AbortSignal.timeout(10000)
        });
      } catch(e) {}
      showToast('تم إرسال رمز جديد', 'success');
      this.disabled = false; this.textContent = 'إعادة إرسال الرمز';
      // Clear boxes
      for (let i = 0; i < 6; i++) { const b = document.getElementById('fll-otp-' + i); if (b) b.value = ''; }
      document.getElementById('fll-otp-0')?.focus();
    };
  }

  function getOTPCode() {
    let code = '';
    for (let i = 0; i < 6; i++) { code += (document.getElementById('fll-otp-' + i)?.value || ''); }
    return code;
  }

  function showOTPError(msg) {
    const el = document.getElementById('fll-otp-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function finalizeLogin() {
    const auth = window._fllPendingAuth;
    if (!auth) return;

    // Save session (compatible with React SPA)
    localStorage.setItem('fll_session', JSON.stringify({
      token: auth.tokens.AccessToken,
      expires_at: new Date(auth.accessPayload.exp * 1000).toISOString()
    }));
    localStorage.setItem('fll_user', JSON.stringify({
      id: auth.userSub, email: auth.userEmail, name: auth.userName, role: auth.role
    }));
    saveSession({ token: auth.tokens.AccessToken, username: auth.id, email: auth.userEmail, name: auth.userName, groups: auth.groups });

    showToast(`مرحباً ${auth.userName}! جاري التحويل...`, 'success');
    setTimeout(() => { window.location.href = '/admin-panel/dashboard'; }, 1000);
    delete window._fllPendingAuth;
  }

  // --- Direct form submit intercept (backup for when alert isn't triggered) ---
  function interceptLoginButton() {
    const p = window.location.pathname;
    if (p !== '/login' && p !== '/unified-login') return;
    document.querySelectorAll('button').forEach(function(btn) {
      const t = (btn.textContent || '').trim();
      if ((t.includes('تسجيل الدخول') || t.includes('دخول')) && !btn.dataset.fllLoginHooked) {
        btn.dataset.fllLoginHooked = '1';
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          doLogin(p);
        }, true);
      }
    });
  }
  function initLoginIntercept() {
    interceptLoginButton();
    setTimeout(interceptLoginButton, 500);
    setTimeout(interceptLoginButton, 1500);
    setTimeout(interceptLoginButton, 3000);
    if (document.body) {
      new MutationObserver(function(){ setTimeout(interceptLoginButton, 100); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLoginIntercept);
  else initLoginIntercept();

  // --- Register: Redirect to full courier registration wizard ---
  function doRegister() {
    showToast('جاري التحويل لنموذج التسجيل...','info',2000);
    setTimeout(function(){ window.location.href = '/courier/register'; }, 400);
  }

  // --- Proactive: Intercept "إنشاء حساب جديد" tab click to redirect immediately ---
  function interceptRegisterTab() {
    if (window.location.pathname !== '/login') return;
    document.querySelectorAll('button, a, [role="tab"]').forEach(function(el) {
      var t = (el.textContent || '').trim();
      if ((t.includes('إنشاء حساب') || t === 'حساب جديد') && !el.dataset.fllRegHooked) {
        el.dataset.fllRegHooked = '1';
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          window.location.href = '/courier/register';
        }, true); // capture phase — fires before Skywork handlers
      }
    });
  }

  // Run tab intercept on load and on DOM mutations
  function initRegisterIntercept() {
    interceptRegisterTab();
    setTimeout(interceptRegisterTab, 500);
    setTimeout(interceptRegisterTab, 1500);
    setTimeout(interceptRegisterTab, 3000);
    if (document.body) {
      new MutationObserver(function(){ setTimeout(interceptRegisterTab, 100); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRegisterIntercept);
  else initRegisterIntercept();

  // --- Forgot Password ---
  document.addEventListener('click', (e) => {
    const el=e.target.closest('button,a'); if(!el) return;
    if(el.textContent.trim().includes('نسيت كلمة المرور')){e.preventDefault();e.stopPropagation();showForgotPW();}
  }, true);

  function showForgotPW() {
    const x=document.getElementById('fll-fp');if(x)x.remove();
    const ov=document.createElement('div');ov.id='fll-fp';
    ov.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;animation:fti .2s ease-out';
    ov.innerHTML=`<div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:'Segoe UI',Tahoma,sans-serif"><h3 style="margin:0 0 8px;font-size:20px;color:#0f2744">استعادة كلمة المرور</h3><p style="margin:0 0 20px;color:#64748b;font-size:14px">أدخل بريدك الإلكتروني</p><div id="fps1"><input id="fpe" type="email" placeholder="البريد الإلكتروني" style="width:100%;padding:12px 16px;border:1px solid #e2e8f0;border-radius:8px;font-size:15px;direction:rtl;margin-bottom:12px;box-sizing:border-box"><button id="fps" style="width:100%;padding:12px;border:none;border-radius:8px;background:#0f2744;color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px">إرسال الرمز</button></div><div id="fps2" style="display:none"><input id="fpc" type="text" placeholder="رمز التحقق" maxlength="6" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:15px;text-align:center;letter-spacing:4px;margin-bottom:12px;box-sizing:border-box"><input id="fpn" type="password" placeholder="كلمة المرور الجديدة" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;font-size:15px;direction:rtl;margin-bottom:12px;box-sizing:border-box"><button id="fpr" style="width:100%;padding:12px;border:none;border-radius:8px;background:#0f2744;color:#fff;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px">تغيير كلمة المرور</button></div><button id="fpcl" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:transparent;color:#64748b;font-size:14px;cursor:pointer">إلغاء</button></div>`;
    document.body.appendChild(ov);
    let em='';
    document.getElementById('fpcl').onclick=()=>ov.remove();
    ov.onclick=(e)=>{if(e.target===ov)ov.remove();};
    document.getElementById('fps').onclick=async()=>{
      em=document.getElementById('fpe').value.trim();if(!em){showToast('أدخل البريد','error');return;}
      const b=document.getElementById('fps');setLoad(b,true);
      await authAPI('/auth/forgot',{email:em,identifier:em});
      setLoad(b,false);showToast('تم إرسال الرمز','success');
      document.getElementById('fps1').style.display='none';document.getElementById('fps2').style.display='block';
    };
    document.getElementById('fpr').onclick=async()=>{
      const c=document.getElementById('fpc').value.trim(),p=document.getElementById('fpn').value;
      if(!c||!p){showToast('أدخل الرمز وكلمة المرور','error');return;}
      const b=document.getElementById('fpr');setLoad(b,true);
      const r=await authAPI('/auth/reset',{identifier:em,email:em,code:c,password:p});
      setLoad(b,false);
      if(r.ok){showToast('تم تغيير كلمة المرور!','success');ov.remove();}
      else showToast(r.data.message||'خطأ','error');
    };
  }

  // --- Auto-redirect ---
  (function(){const s=getSession(),p=window.location.pathname;if(s&&(p==='/login'||p==='/unified-login')){const d=getRedirect(s.groups);if(d!=='/')window.location.href=d;}})();

  // --- Global ---
  window.FLLAuth = { getSession, clearSession, logout:()=>{clearSession();window.location.href='/';}, isLoggedIn:()=>!!getSession(), getUser:()=>getSession(), getToken:()=>localStorage.getItem('fll_token') };

  console.log('✅ FLL Auth Connector v4.1 — Alert interception active (NO OTP) | Legacy HTML redirect guard active');
})();
