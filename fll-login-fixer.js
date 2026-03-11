/**
 * FLL Login Fixer v2.0
 * - يعترض form submit مباشرة (بدل الاعتماد على alert)
 * - يشيل validation رقم الهاتف
 * - يضيف أيقونة إظهار كلمة المرور
 */
(function() {
  // The React SPA now handles /unified-login and /login natively — this fixer is no longer needed
  return;

  const API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';

  function fixLoginPage() {
    // 1. Hide phone validation errors (targeted search instead of querySelectorAll('*'))
    document.querySelectorAll('span, p, div, label, small').forEach(el => {
      if (el.children.length > 0) return;
      const t = el.textContent || '';
      if (t.includes('يبدأ بـ 5') || t.includes('يكون 9') || t.includes('رقم الهاتف غير صحيح')) {
        el.style.display = 'none';
      }
    });

    // 2. Fix inputs on unified-login
    if (p === '/unified-login') {
      document.querySelectorAll('input').forEach(input => {
        if (input.type === 'tel' || input.inputMode === 'numeric') {
          input.type = 'text';
          input.inputMode = 'email';
          input.removeAttribute('pattern');
          input.removeAttribute('maxlength');
          input.removeAttribute('minlength');
        }
      });
    }

    // 3. Add password toggle
    document.querySelectorAll('input[type="password"]').forEach(input => {
      if (input.dataset.fllToggle) return;
      input.dataset.fllToggle = '1';
      const wrap = input.parentElement;
      if (!wrap) return;
      wrap.style.position = 'relative';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '👁';
      btn.style.cssText = 'position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;padding:4px;opacity:0.5;z-index:10';
      btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); input.type = input.type === 'password' ? 'text' : 'password'; btn.innerHTML = input.type === 'password' ? '👁' : '🔒'; };
      wrap.appendChild(btn);
    });

    // 4. CRITICAL: Intercept submit button click directly
    const submitBtns = document.querySelectorAll('button[type="submit"], button');
    submitBtns.forEach(btn => {
      const t = (btn.textContent || '').trim();
      if ((t.includes('تسجيل الدخول') || t.includes('دخول')) && !btn.dataset.fllHooked) {
        btn.dataset.fllHooked = '1';
        
        // Add a click listener with highest priority
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Get form values
          const form = btn.closest('form') || document.querySelector('form');
          const inputs = form ? form.querySelectorAll('input') : document.querySelectorAll('input');
          let username = '', password = '';
          
          inputs.forEach(inp => {
            if (inp.type === 'password' || (inp.type === 'text' && inp.value.includes('*'))) {
              password = inp.value;
            } else if (inp.type === 'text' || inp.type === 'tel' || inp.type === 'email') {
              if (inp.value && !username) username = inp.value;
            }
          });

          if (!username || !password) return;
          
          doDirectLogin(username, password, btn);
        }, true); // capture phase
      }
    });
  }

  async function doDirectLogin(username, password, btn) {
    btn.disabled = true;
    const origText = btn.textContent;
    btn.textContent = 'جاري تسجيل الدخول...';
    btn.style.opacity = '0.7';

    try {
      const r = await fetch(API + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await r.json();

      if (data.challenge === 'EMAIL_OTP') {
        // Show OTP page - dispatch custom event for auth-connector
        window.dispatchEvent(new CustomEvent('fll-mfa-required', { detail: { username, session: data.session, page: p } }));
        showOTPPage(username, data.session);
      } else if (data.token) {
        // Direct login success
        localStorage.setItem('fll_token', data.token || '');
        localStorage.setItem('fll_user', JSON.stringify({ email: data.user?.email || username, name: data.user?.name || '', groups: data.user?.groups || [] }));
        showToast('تم تسجيل الدخول بنجاح! ✅');
        const groups = data.user?.groups || data.groups || [];
        const redirect = getRedirectPath(groups);
        setTimeout(() => { window.location.href = redirect; }, 1000);
      } else {
        showToast(data.message || 'بيانات الدخول غير صحيحة ❌');
        btn.disabled = false;
        btn.textContent = origText;
        btn.style.opacity = '1';
      }
    } catch(err) {
      showToast('خطأ في الاتصال بالخادم');
      btn.disabled = false;
      btn.textContent = origText;
      btn.style.opacity = '1';
    }
  }

  function showOTPPage(username, session) {
    const main = document.querySelector('main') || document.querySelector('[class*="content"]') || document.querySelector('form')?.parentElement?.parentElement;
    if (!main) return;

    main.innerHTML = `
      <div style="max-width:420px;margin:40px auto;padding:32px 24px;text-align:center;direction:rtl;font-family:'Segoe UI',Tahoma,sans-serif">
        <div style="width:72px;height:72px;margin:0 auto 20px;background:linear-gradient(135deg,#0f2744,#1e3a5f);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(15,39,68,0.3)">
          <span style="font-size:32px">📧</span>
        </div>
        <h2 style="color:#0f2744;margin:0 0 8px;font-size:24px;font-weight:700">رمز التحقق</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.7">تم إرسال رمز التحقق إلى بريدك الإلكتروني<br><strong id="fll-otp-user2" style="color:#0f2744;font-size:15px"></strong></p>
        <div style="margin:0 0 24px">
          <input id="fll-otp" type="text" inputmode="numeric" maxlength="6" placeholder="------"
            style="width:100%;padding:16px;text-align:center;font-size:28px;letter-spacing:12px;border:2px solid #d1d5db;border-radius:12px;outline:none;font-family:monospace;direction:ltr;box-sizing:border-box;transition:border-color .2s"
            onfocus="this.style.borderColor='#0f2744'" onblur="this.style.borderColor='#d1d5db'">
        </div>
        <button id="fll-verify" style="width:100%;padding:16px;background:linear-gradient(135deg,#0f2744,#1e3a5f);color:#fff;border:none;border-radius:12px;font-size:17px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 15px rgba(15,39,68,0.3)">
          ✓ تأكيد الرمز
        </button>
        <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">⏱ الرمز صالح لمدة 3 دقائق</p>
        <button onclick="location.reload()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:13px;margin-top:16px;font-family:inherit;text-decoration:underline">↩ العودة لتسجيل الدخول</button>
      </div>`;

    const otpInput = document.getElementById('fll-otp');
    const verifyBtn = document.getElementById('fll-verify');
    const userEl2 = document.getElementById('fll-otp-user2');
    if (userEl2) userEl2.textContent = username;
    setTimeout(() => otpInput.focus(), 200);

    otpInput.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D/g, '');
      if (otpInput.value.length === 6) verifyBtn.click();
    });

    verifyBtn.addEventListener('click', async () => {
      const code = otpInput.value.trim();
      if (code.length !== 6) { showToast('أدخل الرمز المكون من 6 أرقام'); return; }
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'جاري التحقق...';
      try {
        const r = await fetch(API + '/auth/respond-mfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, code, session, challenge: 'EMAIL_OTP' })
        });
        const data = await r.json();
        if (data.token) {
          localStorage.setItem('fll_token', data.token);
          localStorage.setItem('fll_user', JSON.stringify({ email: data.user?.email || username, name: data.user?.name || '', groups: data.user?.groups || [] }));
          showToast('تم تسجيل الدخول بنجاح! ✅');
          const redirect = getRedirectPath(data.user?.groups || []);
          setTimeout(() => { window.location.href = redirect; }, 1000);
        } else {
          showToast(data.message || 'رمز التحقق غير صحيح ❌');
          verifyBtn.disabled = false;
          verifyBtn.textContent = '✓ تأكيد الرمز';
          otpInput.value = '';
          otpInput.focus();
        }
      } catch(e) {
        showToast('خطأ في الاتصال');
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✓ تأكيد الرمز';
      }
    });

    otpInput.addEventListener('keydown', e => { if (e.key === 'Enter') verifyBtn.click(); });
  }

  function getRedirectPath(groups) {
    const map = { SystemAdmin:'/admin-dashboard', admin:'/admin-dashboard', finance:'/staff-finance', hr:'/staff-hr', ops:'/staff-ops', fleet:'/staff-fleet', staff:'/staff-dashboard', driver:'/courier-dashboard', executive:'/admin-dashboard' };
    for (const g of (groups||[])) { if (map[g]) return map[g]; }
    return '/';
  }

  function showToast(msg) {
    const old = document.getElementById('fll-toast'); if(old) old.remove();
    const t = document.createElement('div');
    t.id = 'fll-toast';
    t.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 32px;border-radius:12px;color:#fff;font-size:15px;font-weight:600;font-family:Segoe UI,Tahoma,sans-serif;direction:rtl;box-shadow:0 8px 32px rgba(0,0,0,.3);max-width:90%;text-align:center;background:#0f2744;animation:fadeIn .3s';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  // Run with debounced MutationObserver
  let _fixTimer = null;
  function debouncedFix() { if (_fixTimer) clearTimeout(_fixTimer); _fixTimer = setTimeout(fixLoginPage, 200); }
  function init() { fixLoginPage(); setTimeout(fixLoginPage, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  new MutationObserver(debouncedFix).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
