/**
 * FLL Image Fixer v1.2
 * - يستبدل صور Skywork بصور محلية + يضبط الحجم
 * - يستبدل صورة Market Analysis Infographic بشعار الشركة
 */
(function () {
  const LOGO = "/public/images/first_line_correct_logos_1.jpg";
  const TEAM = "/public/images/fll-team.jpg";

  // Map of exact image keys → local files
  const imageMap = {
    DSC03703: TEAM,
    first_line_correct_logos_1: LOGO,
    "WhatsApp Image 2026-02-08": TEAM,
  };

  // Keywords that indicate an analytics/infographic image → replace with logo
  const infographicKeywords = [
    "market",
    "analysis",
    "kpi",
    "saudi_arabia",
    "infographic",
    "performance",
    "quarterly",
    "tga",
    "argaam",
    "strategic",
  ];

  function fixImages() {
    document.querySelectorAll("img").forEach((img) => {
      const src = (img.src || img.getAttribute("src") || "").toLowerCase();
      if (!src.includes("static-us-img.skywork.ai")) return;

      let replaced = false;

      // 1. Exact key match
      for (const [key, localPath] of Object.entries(imageMap)) {
        if (src.includes(key.toLowerCase())) {
          applyImage(img, localPath);
          replaced = true;
          break;
        }
      }

      // 2. Analytics/infographic detection → use logo
      if (!replaced) {
        for (const kw of infographicKeywords) {
          if (src.includes(kw)) {
            applyImage(img, LOGO, true); // logo styling
            replaced = true;
            break;
          }
        }
      }
    });
  }

  function applyImage(img, localPath, isLogo) {
    img.src = localPath;
    img.style.objectFit = "contain";
    img.style.maxWidth = "100%";
    img.style.maxHeight = isLogo ? "300px" : "500px";
    img.style.width = "auto";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.margin = "0 auto";
    img.style.borderRadius = "12px";
    if (isLogo) {
      img.style.padding = "20px";
      img.style.background = "rgba(255,255,255,0.05)";
    }
    const parent = img.parentElement;
    if (parent) {
      parent.style.maxWidth = isLogo ? "400px" : "600px";
      parent.style.margin = "0 auto";
      parent.style.overflow = "hidden";
      parent.style.borderRadius = "12px";
    }
  }

  // Run on load + delays for SPA
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      fixImages();
      setTimeout(fixImages, 500);
      setTimeout(fixImages, 1500);
      setTimeout(fixImages, 3000);
    });
  } else {
    fixImages();
    setTimeout(fixImages, 500);
    setTimeout(fixImages, 1500);
    setTimeout(fixImages, 3000);
  }

  // Watch for new images (SPA route changes)
  const observer = new MutationObserver(() => fixImages());
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
