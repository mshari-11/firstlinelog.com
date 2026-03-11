/**
 * FLL Content Fixer v1.1
 * - يحدث رقم الشركة 920014948 + إيميل info@fll.sa
 * - صفحات الامتثال → support@fll.sa
 * - نموذج اتصل بنا → يرسل تأكيد من no-reply@fll.sa
 */
(function() {
  const OLD_PHONE = '0126033133';
  const NEW_PHONE = '920014948';
  const OLD_EMAIL = 'info@firstlinelog.com';
  const NEW_EMAIL = 'info@fll.sa';
  const SUPPORT_EMAIL = 'support@fll.sa';
  const API = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';

  function fixContent() {
    // 1. Replace phone + email in text nodes
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while (n = walk.nextNode()) {
      if (n.nodeValue.includes(OLD_PHONE)) n.nodeValue = n.nodeValue.split(OLD_PHONE).join(NEW_PHONE);
      if (n.nodeValue.includes(OLD_EMAIL)) n.nodeValue = n.nodeValue.split(OLD_EMAIL).join(NEW_EMAIL);
    }

    // 2. Fix links
    document.querySelectorAll('a').forEach(a => {
      if (a.href.includes(OLD_EMAIL)) a.href = a.href.split(OLD_EMAIL).join(NEW_EMAIL);
      if (a.href.includes(OLD_PHONE)) a.href = a.href.split(OLD_PHONE).join(NEW_PHONE);
    });

    // 3. Compliance/governance → support@fll.sa
    const p = location.pathname;
    if (['/compliance','/terms','/privacy','/operational-model'].includes(p)) {
      document.querySelectorAll('a[href*="mailto:"]').forEach(a => {
        if (a.href.includes(OLD_EMAIL) || a.href.includes(NEW_EMAIL)) {
          a.href = 'mailto:' + SUPPORT_EMAIL;
          if (a.textContent.includes('@')) a.textContent = SUPPORT_EMAIL;
        }
      });
    }

    // 4. Contact page — enhance form
    if (p === '/contact') enhanceForm();
  }

  function enhanceForm() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.dataset.fllDone) return;
      form.dataset.fllDone = '1';

      const btn = form.querySelector('button[type="submit"], button:last-of-type');
      if (!btn) return;

      // Add email field if missing
      if (!form.querySelector('input[type="email"]')) {
        const d = document.createElement('div');
        d.style.cssText = 'margin:12px 0';
        d.innerHTML = '<label style="display:block;margin-bottom:4px;font-size:14px;color:#64748b">📧 البريد الإلكتروني</label><input type="email" name="sender_email" placeholder="example@email.com" required style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;direction:ltr;text-align:right">';
        btn.parentElement.insertBefore(d, btn);
      }

      // Add phone field if missing
      if (!form.querySelector('input[type="tel"]')) {
        const d = document.createElement('div');
        d.style.cssText = 'margin:12px 0';
        d.innerHTML = '<label style="display:block;margin-bottom:4px;font-size:14px;color:#64748b">📱 رقم الجوال</label><input type="tel" name="sender_phone" placeholder="05XXXXXXXX" style="width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;direction:ltr;text-align:right">';
        btn.parentElement.insertBefore(d, btn);
      }

      // Intercept submit
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fd = new FormData(form);
        const data = Object.fromEntries(fd.entries());
        const email = data.sender_email || data.email || '';
        const name = data.name || data.sender_name || '';

        btn.disabled = true;
        const origText = btn.textContent;
        btn.textContent = 'جاري الإرسال...';

        try {
          // Send contact form data + confirmation email via Lambda
          if (email) {
            const message = data.message || data.subject || data.content || '';
            const phone = data.phone || data.sender_phone || '';
            await fetch(API + '/api/contact-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sender_email: email, name: name, message: message, phone: phone })
            });
          }

          form.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:48px;margin-bottom:16px">✅</div><h3 style="color:#0f2744;font-size:20px;margin-bottom:8px">تم استقبال رسالتكم بنجاح!</h3><p style="color:#64748b;font-size:14px;line-height:1.8">سيتم الرد عليكم قريباً إن شاء الله.<br>📞 <strong>920014948</strong> | 📧 <strong>support@fll.sa</strong></p></div>';
        } catch(err) {
          btn.disabled = false;
          btn.textContent = origText;
          alert('حدث خطأ، حاول مرة أخرى');
        }
      });
    });
  }

  let _cfTimer = null;
  function debouncedFixContent() { if (_cfTimer) clearTimeout(_cfTimer); _cfTimer = setTimeout(fixContent, 300); }
  function init() { fixContent(); setTimeout(fixContent, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  new MutationObserver(debouncedFixContent)
    .observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
