/**
 * FLL Auth Connector v3.0 — Production
 * 
 * Strategy: The Skywork React bundle does client-side validation only,
 * then calls alert("تم تسجيل الدخول بنجاح!" or "تم إنشاء الحساب بنجاح!").
 * We intercept this alert() and replace it with real AWS Cognito API calls.
 * 
 * Pages:
 * - /login          → نظام السائقين والمناديب (login + register tabs)
 * - /unified-login  → نظام الإداريين والموظفين (login only)
 */

(function() {
  'use strict';

  const API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';
  const REDIRECT = {
    driver: '/courier-dashboard.html', staff: '/staff-dashboard.html',
    admin: '/admin-dashboard.html', finance: '/admin-dashboard.html#finance',
    hr: '/admin-dashboard.html#staff', ops: '/admin-dashboard.html#orders',
    fleet: '/admin-dashboard.html#couriers', executive: '/admin-dashboard.html',
    SystemAdmin: '/admin-dashboard.html'
  };

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
    if(!_ts){_ts=document.createElement('style');_ts.textContent='@keyframes fti{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fto{from{opacity:1}to{opacity:0;transform:translateX(-50%) translateY(-20px)}}#fll-toast{position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 32px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;font-family:\"Segoe UI\",Tahoma,sans-serif;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,.3);max-width:90%;text-align:center;animation:fti .3s ease-out}';document.head.appendChild(_ts);}
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

  // --- Real Login ---
  async function doLogin(page) {
    const v = getVals();
    const id = v.username || v.email || '';
    const pw = v.password || '';
    if (!id||!pw) { showToast('الرجاء إدخال البيانات المطلوبة','error'); return; }

    const btn = findBtn();
    setLoad(btn, true);
    showToast('جاري تسجيل الدخول...','info',10000);

    const r = await authAPI('/auth/login', { username: id, password: pw });
    setLoad(btn, false);

    if (r.ok && r.data.challenge === 'EMAIL_OTP') {
      // MFA Required — show OTP input
      showToast('تم إرسال رمز التحقق إلى بريدك الإلكتروني 📧','info',6000);
      showMFAInput(id, r.data.session, page);
    } else if (r.ok && r.data.token) {
      saveSession(r.data);
      try { fetch(`${API}/api/audit-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',actor:r.data.email||r.data.username,resource_type:page==='/login'?'driver':'staff',timestamp:new Date().toISOString()})}); } catch(e){}
      showToast(`مرحباً ${r.data.name||r.data.username}! جاري التحويل...`,'success');
      setTimeout(()=>{ window.location.href = getRedirect(r.data.groups); }, 1200);
    } else if (r.status===403 && r.data.needsVerification) {
      showToast('يجب تفعيل الحساب — تحقق من بريدك الإلكتروني','warning',6000);
    } else {
      showToast(r.data.message||'بيانات الدخول غير صحيحة','error');
    }
  }

  // --- Real Register ---
  async function doRegister() {
    const v = getVals();
    if (!v.username||!v.password) { showToast('الرجاء تعبئة جميع الحقول','error'); return; }

    const btn = findBtn();
    setLoad(btn, true);
    showToast('جاري إنشاء الحساب...','info',10000);

    const email = v.email || `${v.username}@drivers.fll.sa`;
    const r = await authAPI('/auth/register', { username: v.fullName||v.username, email, password: v.password });
    setLoad(btn, false);

    if (r.ok) {
      // Save driver profile
      try { fetch(`${API}/api/drivers`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nationalId:v.username,fullName:v.fullName||'',email,phone:v.phone||'',status:'pending',registeredAt:new Date().toISOString()})}); } catch(e){}
      showToast('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيل الحساب','success',6000);
    } else {
      showToast(r.data.message||'حدث خطأ أثناء التسجيل','error');
    }
  }

  // --- Forgot Password ---
  document.addEventListener('click', (e) => {
    const el=e.target.closest('button,a'); if(!el) return;
    if(el.textContent.trim().includes('نسيت كلمة المرور')){e.preventDefault();e.stopPropagation();showForgotPW();}
  }, true);

  // --- MFA OTP Input ---
  function showMFAInput(username, session, page) {
    // Replace the login form with OTP input
    const formArea = document.querySelector('form') || document.querySelector('[class*="login"], [class*="form"], [class*="card"]');
    if (!formArea) return;
    
    const container = formArea.parentElement || formArea;
    const originalHTML = container.innerHTML;
    
    container.innerHTML = `
      <div style="max-width:420px;margin:0 auto;padding:32px 24px;text-align:center;direction:rtl;font-family:'Segoe UI',Tahoma,sans-serif">
        <div style="width:64px;height:64px;margin:0 auto 16px;background:#0f2744;border-radius:50%;display:flex;align-items:center;justify-content:center">
          <span style="font-size:28px">📧</span>
        </div>
        <h2 style="color:#0f2744;margin:0 0 8px;font-size:22px">رمز التحقق</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6">تم إرسال رمز التحقق إلى بريدك الإلكتروني<br><strong style="color:#0f2744">${username}</strong></p>
        <div style="margin:0 0 20px">
          <input id="fll-otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="أدخل الرمز المكون من 6 أرقام"
            style="width:100%;padding:14px;text-align:center;font-size:24px;letter-spacing:8px;border:2px solid #d1d5db;border-radius:12px;outline:none;font-family:monospace;direction:ltr;box-sizing:border-box"
            onfocus="this.style.borderColor='#0f2744'" onblur="this.style.borderColor='#d1d5db'">
        </div>
        <button id="fll-verify-btn" style="width:100%;padding:14px;background:#0f2744;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s"
          onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          ✓ تأكيد الرمز
        </button>
        <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">الرمز صالح لمدة 3 دقائق</p>
        <button id="fll-back-btn" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;margin-top:12px;font-family:inherit;text-decoration:underline">
          العودة لتسجيل الدخول
        </button>
      </div>
    `;

    const otpInput = document.getElementById('fll-otp-input');
    const verifyBtn = document.getElementById('fll-verify-btn');
    const backBtn = document.getElementById('fll-back-btn');

    // Focus OTP input
    setTimeout(() => otpInput.focus(), 100);

    // Auto-submit when 6 digits entered
    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '');
      if (otpInput.value.length === 6) verifyBtn.click();
    });

    // Verify OTP
    verifyBtn.addEventListener('click', async () => {
      const code = otpInput.value.trim();
      if (code.length !== 6) { showToast('الرجاء إدخال الرمز المكون من 6 أرقام','warning'); return; }
      
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'جاري التحقق...';
      
      const r = await authAPI('/auth/respond-mfa', { username, code, session, challenge: 'EMAIL_OTP' });
      
      if (r.ok && r.data.token) {
        saveSession(r.data);
        try { fetch(`${API}/api/audit-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login_mfa',actor:username,resource_type:page==='/login'?'driver':'staff',timestamp:new Date().toISOString()})}); } catch(e){}
        showToast(`مرحباً ${r.data.user?.name||username}! جاري التحويل... ✅`,'success');
        setTimeout(()=>{ window.location.href = getRedirect(r.data.user?.groups||r.data.groups||[]); }, 1200);
      } else {
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✓ تأكيد الرمز';
        showToast(r.data.message||'رمز التحقق غير صحيح','error');
        otpInput.value = '';
        otpInput.focus();
      }
    });

    // Back button
    backBtn.addEventListener('click', () => { location.reload(); });

    // Enter key
    otpInput.addEventListener('keydown', (e) => { if(e.key==='Enter') verifyBtn.click(); });
  }

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

  console.log('✅ FLL Auth Connector v3.0 — Alert interception active');
})();
