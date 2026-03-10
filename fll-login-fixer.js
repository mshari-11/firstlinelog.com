/**
 * FLL Login Fixer v1.0
 * - يشيل validation رقم الهاتف من صفحة unified-login
 * - يضيف أيقونة إظهار/إخفاء كلمة المرور
 * - يخلي حقل اسم المستخدم يقبل إيميل
 */
(function() {
  const p = location.pathname;
  if (p !== '/unified-login' && p !== '/login') return;

  function fixLoginPage() {
    // 1. Remove phone validation errors
    document.querySelectorAll('span, div, p').forEach(el => {
      const t = el.textContent || '';
      if (t.includes('رقم الهاتف غير صحيح') || t.includes('يجب أن يبدأ بـ 5') || t.includes('يكون 9 أرقام')) {
        el.style.display = 'none';
        el.textContent = '';
      }
    });

    // 2. Fix username input — remove tel validation, change type to email
    document.querySelectorAll('input').forEach(input => {
      // If it's a phone-type input on unified-login, change to text
      if (p === '/unified-login') {
        if (input.type === 'tel' || input.pattern === '[0-9]*' || input.inputMode === 'numeric') {
          input.type = 'text';
          input.pattern = '';
          input.inputMode = 'email';
          input.placeholder = input.placeholder || 'أدخل البريد الإلكتروني';
          input.removeAttribute('maxlength');
          input.removeAttribute('minlength');
        }
      }

      // 3. Add show/hide password toggle
      if (input.type === 'password' && !input.dataset.fllToggle) {
        input.dataset.fllToggle = '1';
        const wrapper = input.parentElement;
        if (wrapper) {
          wrapper.style.position = 'relative';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.innerHTML = '👁';
          btn.style.cssText = 'position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;padding:4px;opacity:0.5;z-index:10';
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (input.type === 'password') {
              input.type = 'text';
              btn.innerHTML = '🔒';
              btn.style.opacity = '0.8';
            } else {
              input.type = 'password';
              btn.innerHTML = '👁';
              btn.style.opacity = '0.5';
            }
          });
          wrapper.appendChild(btn);
        }
      }
    });

    // 4. Disable Skywork's own validation on unified-login forms
    if (p === '/unified-login') {
      document.querySelectorAll('form').forEach(form => {
        form.setAttribute('novalidate', 'true');
        // Override checkValidity
        const inputs = form.querySelectorAll('input');
        inputs.forEach(inp => {
          inp.setCustomValidity('');
          // Remove min/max length that triggers phone validation
          if (inp.type === 'text' || inp.type === 'tel') {
            inp.removeAttribute('minlength');
            inp.removeAttribute('maxlength');
            inp.removeAttribute('pattern');
          }
        });
      });
    }
  }

  // Run multiple times to catch SPA renders
  function init() {
    fixLoginPage();
    setTimeout(fixLoginPage, 300);
    setTimeout(fixLoginPage, 800);
    setTimeout(fixLoginPage, 1500);
    setTimeout(fixLoginPage, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Watch for SPA changes
  new MutationObserver(() => setTimeout(fixLoginPage, 100))
    .observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
