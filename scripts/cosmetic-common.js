(function () {
  const SELECTORS = [
    "[id*='google_ads']",
    "[id^='div-gpt-ad']",
    "[class*='ad-container']",
    "[class*='ad-banner']",
    "[class*='ad-slot']",
    "[class*='adsbygoogle']",
    "ins.adsbygoogle",
    "[class^='ad-wrapper']",
    "[class*='sponsored-content']",
    "[class*='sponsor-banner']",
    "[id*='taboola']",
    "[id*='outbrain']",
    "[class*='outbrain']",
    "[class*='taboola']",
    "iframe[src*='doubleclick.net']",
    "iframe[src*='googlesyndication.com']",
    "aside[class*='advert']",
    "div[class*='advert']",
    "div[data-ad-slot]",
    "div[data-ad-client]"
  ];

  let cosmeticEnabled = true;
  let styleEl = null;

  function buildCss(selectors) {
    if (selectors.length === 0) return "";
    return selectors.join(",\n") + " {\n  display: none !important;\n  visibility: hidden !important;\n}\n";
  }

  function injectStyle() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.id = "learning-adblock-cosmetic-style";
    styleEl.textContent = buildCss(SELECTORS);
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function removeStyle() {
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
    styleEl = null;
  }

  function applyState() {
    if (cosmeticEnabled) {
      injectStyle();
    } else {
      removeStyle();
    }
  }

  chrome.storage.local.get({ cosmeticEnabled: true, blockingEnabled: true }, (settings) => {
    cosmeticEnabled = settings.blockingEnabled && settings.cosmeticEnabled;
    applyState();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.cosmeticEnabled || changes.blockingEnabled) {
      chrome.storage.local.get({ cosmeticEnabled: true, blockingEnabled: true }, (settings) => {
        cosmeticEnabled = settings.blockingEnabled && settings.cosmeticEnabled;
        applyState();
      });
    }
  });
})();
