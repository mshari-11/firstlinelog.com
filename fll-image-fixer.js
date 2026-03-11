/**
 * FLL Image Fixer v1.1
 * يستبدل الصور من سيرفر Skywork بصور محلية + يضبط الحجم
 */
(function() {
  const imageMap = {
    'DSC03703': '/public/images/fll-team.jpg',
    'first_line_correct_logos_1': '/public/images/first_line_correct_logos_1.jpg',
    'WhatsApp Image 2026-02-08': '/public/images/fll-team.jpg'
  };

  function fixImages() {
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('src') || '';
      if (src.includes('static-us-img.skywork.ai')) {
        for (const [key, localPath] of Object.entries(imageMap)) {
          if (src.includes(key)) {
            img.src = localPath;
            img.style.objectFit = 'contain';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '500px';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            img.style.borderRadius = '12px';
            // Also fix the parent container if it has weird sizing
            const parent = img.parentElement;
            if (parent) {
              parent.style.maxWidth = '600px';
              parent.style.margin = '0 auto';
              parent.style.overflow = 'hidden';
              parent.style.borderRadius = '12px';
            }
            break;
          }
        }
      }
    });
  }

  // Run on load + debounced MutationObserver
  let _imgTimer = null;
  function debouncedFixImages() { if (_imgTimer) clearTimeout(_imgTimer); _imgTimer = setTimeout(fixImages, 200); }
  function init() { fixImages(); setTimeout(fixImages, 1000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Watch for new images (SPA route changes)
  new MutationObserver(debouncedFixImages)
    .observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
