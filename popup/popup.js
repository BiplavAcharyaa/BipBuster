const DEFAULT_SETTINGS = {
  blockingEnabled: true,
  cosmeticEnabled: true,
  customDomains: []
};

const blockingToggle = document.getElementById("blockingToggle");
const cosmeticToggle = document.getElementById("cosmeticToggle");
const tabBlockedCountEl = document.getElementById("tabBlockedCount");
const customDomainCountEl = document.getElementById("customDomainCount");
const openOptionsBtn = document.getElementById("openOptions");

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    blockingToggle.checked = settings.blockingEnabled;
    cosmeticToggle.checked = settings.cosmeticEnabled;
    customDomainCountEl.textContent = (settings.customDomains || []).length;
  });
}

function loadTabStats() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tabId = tabs[0].id;
    chrome.runtime.sendMessage(
      { type: "GET_TAB_BLOCKED_COUNT", tabId },
      (response) => {
        if (chrome.runtime.lastError) {
          tabBlockedCountEl.textContent = "N/A";
          return;
        }
        if (response && typeof response.count === "number") {
          tabBlockedCountEl.textContent = response.count;
        } else {
          tabBlockedCountEl.textContent = "N/A";
        }
      }
    );
  });
}

blockingToggle.addEventListener("change", () => {
  chrome.storage.local.set({ blockingEnabled: blockingToggle.checked });
});

cosmeticToggle.addEventListener("change", () => {
  chrome.storage.local.set({ cosmeticEnabled: cosmeticToggle.checked });
});

openOptionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadSettings();
loadTabStats();
