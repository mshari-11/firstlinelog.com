/**
 * FLL Login Fixer v3.1
 * OTP disabled — direct password login only
 * - Intercepts form submit
 * - Sends to AWS Cognito API
 * - Auto-redirects on success
 *
 * v3.1: getRedirectPath updated to SPA routes (aligned with fll-auth-connector v4.1)
 */
(function() {
  const p = location.pathname;
  if (p !== '/unified-login' && p !== '/login') return;

  const API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';

  function fixLoginPage() {
    // 1. Hide phone validation errors
    document.querySelectorAll('*').forEach(el => {
      const t = el.textContent || '';
      if ((t.includes('يبدأ بـ 5') || t.includes('يكون 9') || t.includes('رقم الهاتف غير صحيح')) && el.children.length === 0) {
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
            if (inp.type === 'password' || inp.type === 'text' && inp.value.includes('*')) {
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

      if (data.token) {
        // Direct login success — no OTP
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

  function getRedirectPath(groups) {
    const map = {
      SystemAdmin: '/admin-panel/dashboard',
      admin:       '/admin-panel/dashboard',
      executive:   '/admin-panel/dashboard',
      staff:       '/admin-panel/dashboard',
      finance:     '/admin-panel/finance',
      hr:          '/admin-panel/staff',
      ops:         '/admin-panel/dispatch',
      fleet:       '/admin-panel/fleet',
      driver:      '/courier/portal'
    };
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

  // Run
  function init() { fixLoginPage(); setTimeout(fixLoginPage, 500); setTimeout(fixLoginPage, 1500); setTimeout(fixLoginPage, 3000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  new MutationObserver(() => setTimeout(fixLoginPage, 150)).observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
