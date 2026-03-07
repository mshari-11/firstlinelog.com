/**
 * FLL Auth Connector v2.0
 * يربط فورمات Skywork المبنية (React) بـ AWS Auth APIs
 * لا يعدل التصميم — يعترض الفورمات ويضيف وظائف الاتصال
 * 
 * Endpoints:
 * - POST /auth/login     → تسجيل دخول (username/email + password)
 * - POST /auth/register  → إنشاء حساب جديد
 * - POST /auth/verify    → تحقق OTP
 * - POST /auth/resend    → إعادة إرسال OTP
 * - POST /auth/forgot    → نسيت كلمة المرور
 * - POST /auth/reset     → إعادة تعيين كلمة المرور
 */

(function() {
  'use strict';

  // ==============================
  // Configuration
  // ==============================
  const CONFIG = {
    API_BASE: 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com',
    REDIRECT: {
      driver: '/courier-dashboard',
      staff: '/staff-dashboard',
      admin: '/admin-dashboard',
      finance: '/staff-dashboard',
      hr: '/staff-dashboard',
      ops: '/staff-dashboard',
      fleet: '/staff-dashboard',
      executive: '/admin-dashboard',
      SystemAdmin: '/admin-dashboard'
    },
    SESSION_KEY: 'fll_session',
    TOKEN_KEY: 'fll_token',
    USER_KEY: 'fll_user'
  };

  // ==============================
  // API Client
  // ==============================
  async function authAPI(endpoint, data) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      return { ok: res.ok, status: res.status, data: json };
    } catch (err) {
      console.error('FLL Auth API Error:', err);
      return { ok: false, status: 0, data: { message: 'خطأ في الاتصال بالخادم. حاول مرة أخرى.' } };
    }
  }

  // ==============================
  // Session Management
  // ==============================
  function saveSession(data) {
    try {
      localStorage.setItem(CONFIG.TOKEN_KEY, data.token || '');
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({
        username: data.username,
        email: data.email,
        name: data.name,
        groups: data.groups || []
      }));
      localStorage.setItem(CONFIG.SESSION_KEY, Date.now().toString());
    } catch(e) { console.warn('Session save failed:', e); }
  }

  function getSession() {
    try {
      const user = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null');
      const token = localStorage.getItem(CONFIG.TOKEN_KEY);
      return (user && token) ? { ...user, token } : null;
    } catch { return null; }
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    localStorage.removeItem(CONFIG.SESSION_KEY);
  }

  function getRedirectPath(groups) {
    if (!groups || !groups.length) return '/';
    for (const group of groups) {
      if (CONFIG.REDIRECT[group]) return CONFIG.REDIRECT[group];
    }
    return '/';
  }

  // ==============================
  // Toast Notification System
  // ==============================
  function showToast(message, type = 'info') {
    // Remove any existing toast
    const existing = document.getElementById('fll-toast');
    if (existing) existing.remove();

    const colors = {
      success: { bg: '#059669', border: '#34d399' },
      error: { bg: '#dc2626', border: '#f87171' },
      info: { bg: '#2563eb', border: '#60a5fa' },
      warning: { bg: '#d97706', border: '#fbbf24' }
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.id = 'fll-toast';
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 99999; padding: 14px 28px; border-radius: 12px;
      background: ${c.bg}; color: white; font-size: 15px; font-weight: 600;
      font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid ${c.border};
      animation: fll-toast-in 0.3s ease-out;
      max-width: 90%; text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add animation styles if not present
    if (!document.getElementById('fll-toast-style')) {
      const style = document.createElement('style');
      style.id = 'fll-toast-style';
      style.textContent = `
        @keyframes fll-toast-in { from { opacity:0; transform: translateX(-50%) translateY(-20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        @keyframes fll-toast-out { from { opacity:1; } to { opacity:0; transform: translateX(-50%) translateY(-20px); } }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.animation = 'fll-toast-out 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ==============================
  // Loading Overlay
  // ==============================
  function showLoading(button) {
    if (!button) return () => {};
    const original = button.textContent;
    const originalDisabled = button.disabled;
    button.disabled = true;
    button.style.opacity = '0.7';
    button.textContent = 'جاري المعالجة...';
    return () => {
      button.disabled = originalDisabled;
      button.style.opacity = '1';
      button.textContent = original;
    };
  }

  // ==============================
  // Form Interceptor — the core engine
  // ==============================
  
  // Track which page we're on
  let currentPath = window.location.pathname;
  let isAttached = false;
  let observer = null;

  function getCurrentPage() {
    const path = window.location.pathname;
    if (path === '/login') return 'driver-login';
    if (path === '/unified-login') return 'staff-login';
    return null;
  }

  // Find and attach to forms on the page
  function attachToForms() {
    const page = getCurrentPage();
    if (!page) return;

    // Find all form elements or form-like containers
    const forms = document.querySelectorAll('form');
    const buttons = document.querySelectorAll('button[type="submit"], button');
    
    if (page === 'driver-login') {
      attachDriverLogin();
    } else if (page === 'staff-login') {
      attachStaffLogin();
    }
  }

  function attachDriverLogin() {
    // The driver login page has tabs: "تسجيل الدخول" and "إنشاء حساب جديد"
    // We need to intercept form submissions
    
    // Strategy: Listen for click events on submit buttons and intercept
    document.addEventListener('click', handleDriverFormClick, true);
    document.addEventListener('submit', handleDriverFormSubmit, true);
    console.log('✅ FLL: Driver login form interceptor attached');
  }

  function attachStaffLogin() {
    document.addEventListener('click', handleStaffFormClick, true);
    document.addEventListener('submit', handleStaffFormSubmit, true);
    console.log('✅ FLL: Staff login form interceptor attached');
  }

  // ==============================
  // Driver Login Handlers (/login)
  // ==============================
  
  async function handleDriverFormClick(e) {
    if (window.location.pathname !== '/login') return;
    
    const btn = e.target.closest('button[type="submit"]');
    if (!btn) return;

    // Find the closest form
    const form = btn.closest('form');
    if (!form) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Determine which tab is active: login or register
    // Check for tab indicators - look at active tab trigger
    const activeTab = document.querySelector('[role="tabpanel"]:not([hidden])') 
      || document.querySelector('[data-state="active"][role="tabpanel"]');
    
    // Get all visible inputs
    const inputs = form.querySelectorAll('input:not([type="hidden"])');
    const inputData = {};
    inputs.forEach(inp => {
      const label = inp.closest('div')?.querySelector('label')?.textContent?.trim() || '';
      const placeholder = inp.getAttribute('placeholder') || '';
      inputData[label || placeholder || inp.name || inp.type] = inp.value;
    });

    // Determine if this is login or register based on visible fields
    const isRegister = inputs.length > 2; // Register has more fields
    
    const restore = showLoading(btn);

    if (isRegister) {
      await handleDriverRegister(inputData, form, restore);
    } else {
      await handleDriverLoginSubmit(inputData, form, restore);
    }
  }

  async function handleDriverFormSubmit(e) {
    if (window.location.pathname !== '/login') return;
    e.preventDefault();
    e.stopPropagation();
    // Handled by click handler
  }

  async function handleDriverLoginSubmit(inputData, form, restore) {
    // Extract username (national ID) and password
    const inputs = form.querySelectorAll('input');
    let username = '', password = '';
    
    inputs.forEach(inp => {
      if (inp.type === 'password') {
        password = inp.value;
      } else if (inp.type === 'text' || inp.type === 'tel' || inp.type === 'number' || inp.type === 'email' || !inp.type) {
        username = inp.value;
      }
    });

    if (!username || !password) {
      showToast('الرجاء إدخال رقم الهوية وكلمة المرور', 'error');
      restore();
      return;
    }

    const result = await authAPI('/auth/login', { username, password });
    restore();

    if (result.ok) {
      saveSession(result.data);
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      
      // Redirect based on groups
      const redirectPath = getRedirectPath(result.data.groups);
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 800);
    } else if (result.status === 403 && result.data.needsVerification) {
      showToast('يجب تفعيل الحساب — تحقق من بريدك الإلكتروني', 'warning');
      // Could show OTP verification modal here
    } else {
      showToast(result.data.message || 'بيانات الدخول غير صحيحة', 'error');
    }
  }

  async function handleDriverRegister(inputData, form, restore) {
    // Extract registration fields
    const inputs = form.querySelectorAll('input');
    const selects = form.querySelectorAll('select, [role="combobox"]');
    
    let fullName = '', nationalId = '', password = '', confirmPassword = '', email = '';
    
    // Map inputs by their label or placeholder
    inputs.forEach((inp, idx) => {
      const parentText = inp.closest('div')?.previousElementSibling?.textContent?.trim() || '';
      const label = inp.closest('[class*="space-y"]')?.querySelector('label')?.textContent?.trim() || '';
      const allText = parentText + ' ' + label + ' ' + (inp.placeholder || '');
      
      if (allText.includes('الاسم الكامل') || allText.includes('أدخل اسمك')) {
        fullName = inp.value;
      } else if (allText.includes('الهوية الوطنية') || allText.includes('1234567890')) {
        nationalId = inp.value;
      } else if (allText.includes('البريد') || allText.includes('email') || inp.type === 'email') {
        email = inp.value;
      } else if (allText.includes('تأكيد') || allText.includes('confirm')) {
        confirmPassword = inp.value;
      } else if (inp.type === 'password' || allText.includes('كلمة المرور')) {
        if (!password) password = inp.value;
        else confirmPassword = inp.value;
      }
    });

    // Validate
    if (!fullName || !nationalId || !password) {
      showToast('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
      restore();
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      showToast('كلمتا المرور غير متطابقتين', 'error');
      restore();
      return;
    }

    // Use nationalId as email if no email provided (nationalId@fll.sa format)
    if (!email) {
      email = `${nationalId}@drivers.fll.sa`;
    }

    const result = await authAPI('/auth/register', {
      username: fullName,
      email: email,
      password: password,
      nationalId: nationalId
    });
    
    restore();

    if (result.ok) {
      showToast('تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني', 'success');
    } else {
      showToast(result.data.message || 'حدث خطأ أثناء التسجيل', 'error');
    }
  }

  // ==============================
  // Staff Login Handlers (/unified-login)
  // ==============================

  async function handleStaffFormClick(e) {
    if (window.location.pathname !== '/unified-login') return;
    
    const btn = e.target.closest('button[type="submit"]');
    if (!btn) return;

    const form = btn.closest('form');
    if (!form) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const inputs = form.querySelectorAll('input');
    let username = '', password = '';
    
    inputs.forEach(inp => {
      if (inp.type === 'password') {
        password = inp.value;
      } else {
        username = inp.value;
      }
    });

    if (!username || !password) {
      showToast('الرجاء إدخال اسم المستخدم وكلمة المرور', 'error');
      return;
    }

    const restore = showLoading(btn);
    const result = await authAPI('/auth/login', { username, password });
    restore();

    if (result.ok) {
      saveSession(result.data);
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      
      const redirectPath = getRedirectPath(result.data.groups);
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 800);
    } else if (result.status === 403 && result.data.needsVerification) {
      showToast('يجب تفعيل الحساب — تحقق من بريدك الإلكتروني', 'warning');
    } else {
      showToast(result.data.message || 'بيانات الدخول غير صحيحة', 'error');
    }
  }

  async function handleStaffFormSubmit(e) {
    if (window.location.pathname !== '/unified-login') return;
    e.preventDefault();
    e.stopPropagation();
  }

  // ==============================
  // "Forgot Password" Handler
  // ==============================
  function attachForgotPassword() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('button, a');
      if (!link) return;
      const text = link.textContent.trim();
      if (text.includes('نسيت كلمة المرور')) {
        e.preventDefault();
        showForgotPasswordModal();
      }
    });
  }

  function showForgotPasswordModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'fll-forgot-modal';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99998;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fll-toast-in 0.2s ease-out;
    `;

    overlay.innerHTML = `
      <div style="
        background: white; border-radius: 16px; padding: 32px;
        max-width: 420px; width: 90%; direction: rtl;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        font-family: 'Segoe UI', Tahoma, sans-serif;
      ">
        <h3 style="margin: 0 0 8px; font-size: 20px; color: #0f2744;">استعادة كلمة المرور</h3>
        <p style="margin: 0 0 20px; color: #64748b; font-size: 14px;">أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق</p>
        
        <div id="fll-forgot-step1">
          <input id="fll-forgot-email" type="email" placeholder="البريد الإلكتروني" style="
            width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0;
            border-radius: 8px; font-size: 15px; direction: rtl;
            margin-bottom: 12px; box-sizing: border-box;
          " />
          <button id="fll-forgot-send" style="
            width: 100%; padding: 12px; border: none; border-radius: 8px;
            background: #0f2744; color: white; font-size: 15px; font-weight: 600;
            cursor: pointer; margin-bottom: 8px;
          ">إرسال رمز التحقق</button>
        </div>

        <div id="fll-forgot-step2" style="display: none;">
          <input id="fll-forgot-code" type="text" placeholder="رمز التحقق" style="
            width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0;
            border-radius: 8px; font-size: 15px; direction: rtl;
            margin-bottom: 12px; box-sizing: border-box; text-align: center; letter-spacing: 4px;
          " maxlength="6" />
          <input id="fll-forgot-newpass" type="password" placeholder="كلمة المرور الجديدة" style="
            width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0;
            border-radius: 8px; font-size: 15px; direction: rtl;
            margin-bottom: 12px; box-sizing: border-box;
          " />
          <button id="fll-forgot-reset" style="
            width: 100%; padding: 12px; border: none; border-radius: 8px;
            background: #0f2744; color: white; font-size: 15px; font-weight: 600;
            cursor: pointer; margin-bottom: 8px;
          ">تغيير كلمة المرور</button>
        </div>

        <button id="fll-forgot-close" style="
          width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
          background: transparent; color: #64748b; font-size: 14px;
          cursor: pointer;
        ">إلغاء</button>
      </div>
    `;

    document.body.appendChild(overlay);

    let forgotEmail = '';

    // Close
    document.getElementById('fll-forgot-close').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    // Step 1: Send code
    document.getElementById('fll-forgot-send').onclick = async () => {
      forgotEmail = document.getElementById('fll-forgot-email').value.trim();
      if (!forgotEmail) { showToast('الرجاء إدخال البريد الإلكتروني', 'error'); return; }
      
      const btn = document.getElementById('fll-forgot-send');
      const restore = showLoading(btn);
      const result = await authAPI('/auth/forgot', { email: forgotEmail, identifier: forgotEmail });
      restore();
      
      showToast(result.data.message || 'تم إرسال الرمز', 'success');
      document.getElementById('fll-forgot-step1').style.display = 'none';
      document.getElementById('fll-forgot-step2').style.display = 'block';
    };

    // Step 2: Reset password
    document.getElementById('fll-forgot-reset').onclick = async () => {
      const code = document.getElementById('fll-forgot-code').value.trim();
      const newPass = document.getElementById('fll-forgot-newpass').value;
      if (!code || !newPass) { showToast('الرجاء إدخال الرمز وكلمة المرور الجديدة', 'error'); return; }
      
      const btn = document.getElementById('fll-forgot-reset');
      const restore = showLoading(btn);
      const result = await authAPI('/auth/reset', { identifier: forgotEmail, email: forgotEmail, code, password: newPass });
      restore();
      
      if (result.ok) {
        showToast('تم تغيير كلمة المرور بنجاح!', 'success');
        overlay.remove();
      } else {
        showToast(result.data.message || 'حدث خطأ', 'error');
      }
    };
  }

  // ==============================
  // Navigation Links Handler
  // ==============================
  function attachNavigationLinks() {
    // Handle clicks on "تسجيل دخول" buttons on the home page
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href], button');
      if (!link) return;
      
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      
      // Home page login buttons
      if (text === 'تسجيل دخول' || text === 'نظام السائقين' || text === 'نظام الدخول') {
        // Let React Router handle the /login navigation
        return;
      }
      if (text === 'نظام الإداريين والموظفين' || text === 'الموظفين') {
        // Let React Router handle the /unified-login navigation
        return;
      }
    });
  }

  // ==============================
  // Session Checker - Auto redirect if logged in
  // ==============================
  function checkExistingSession() {
    const session = getSession();
    const path = window.location.pathname;
    
    if (session && (path === '/login' || path === '/unified-login')) {
      const redirectPath = getRedirectPath(session.groups);
      if (redirectPath !== '/') {
        window.location.href = redirectPath;
      }
    }
  }

  // ==============================
  // SPA Route Change Observer
  // ==============================
  function observeRouteChanges() {
    let lastPath = window.location.pathname;
    
    // Watch for route changes (React Router uses pushState)
    const origPush = history.pushState;
    history.pushState = function() {
      origPush.apply(this, arguments);
      onRouteChange();
    };
    
    const origReplace = history.replaceState;
    history.replaceState = function() {
      origReplace.apply(this, arguments);
      onRouteChange();
    };
    
    window.addEventListener('popstate', onRouteChange);
    
    function onRouteChange() {
      const newPath = window.location.pathname;
      if (newPath !== lastPath) {
        lastPath = newPath;
        console.log(`📍 FLL: Route changed to ${newPath}`);
        // Re-attach forms after route change with delay for React render
        setTimeout(attachToForms, 500);
        setTimeout(attachToForms, 1500);
      }
    }
  }

  // ==============================
  // Initialize
  // ==============================
  function init() {
    console.log('🚀 FLL Auth Connector v2.0 — Initializing...');
    
    // Check session
    checkExistingSession();
    
    // Observe route changes (SPA)
    observeRouteChanges();
    
    // Attach forgot password handler globally
    attachForgotPassword();
    
    // Attach navigation links
    attachNavigationLinks();
    
    // Attach to forms (with retry for React hydration)
    setTimeout(attachToForms, 500);
    setTimeout(attachToForms, 1500);
    setTimeout(attachToForms, 3000);
    
    // Also observe DOM changes to catch React renders
    observer = new MutationObserver(() => {
      const page = getCurrentPage();
      if (page && !isAttached) {
        isAttached = true;
        attachToForms();
      }
    });
    observer.observe(document.body || document.documentElement, { 
      childList: true, subtree: true 
    });
    
    // Expose globally for debugging
    window.FLLAuth = {
      getSession,
      clearSession,
      logout: () => { clearSession(); window.location.href = '/'; },
      isLoggedIn: () => !!getSession(),
      getUser: () => getSession(),
      config: CONFIG
    };

    console.log('✅ FLL Auth Connector v2.0 — Ready');
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
