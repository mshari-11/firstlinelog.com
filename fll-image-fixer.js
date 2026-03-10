/**
 * FLL Image Fixer v1.0
 * يستبدل الصور من سيرفر Skywork بصور محلية
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
            img.style.objectFit = 'cover';
            break;
          }
        }
      }
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { fixImages(); setTimeout(fixImages, 1000); setTimeout(fixImages, 3000); });
  } else {
    fixImages(); setTimeout(fixImages, 1000); setTimeout(fixImages, 3000);
  }

  // Watch for new images (SPA)
  const observer = new MutationObserver(() => fixImages());
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
