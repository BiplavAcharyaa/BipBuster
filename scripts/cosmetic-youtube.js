(function () {
  const YOUTUBE_SELECTORS = [
    "ytd-display-ad-renderer",
    "ytd-promoted-sparkles-web-renderer",
    "ytd-promoted-video-renderer",
    "ytd-companion-slot-renderer",
    "ytd-action-companion-ad-renderer",
    "ytd-banner-promo-renderer",
    "ytd-statement-banner-renderer",
    "ytd-in-feed-ad-layout-renderer",
    "ytd-ad-slot-renderer",
    "#masthead-ad",
    "#player-ads"
  ];

  let cosmeticEnabled = true;
  let styleEl = null;

  function buildCss(selectors) {
    if (selectors.length === 0) return "";
    return selectors.join(",\n") + " {\n  display: none !important;\n}\n";
  }

  function injectStyle() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.id = "learning-adblock-youtube-style";
    styleEl.textContent = buildCss(YOUTUBE_SELECTORS);
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

  function skipVideoAdIfPresent() {
    if (!cosmeticEnabled) return;

    const skipButton = document.querySelector(
      ".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button"
    );
    if (skipButton) {
      skipButton.click();
      return;
    }

    const adShowing = document.querySelector(".ad-showing");
    if (adShowing) {
      const video = document.querySelector("video");
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = video.duration;
        } catch (e) {
          /* ignore */
        }
      }
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

  const observer = new MutationObserver(() => {
    skipVideoAdIfPresent();
  });

  function startObserving() {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserving);
  } else {
    startObserving();
  }

  setInterval(skipVideoAdIfPresent, 1500);
})();
