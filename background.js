const STATIC_RULESET_ID = "ruleset_ads_trackers";
const CUSTOM_RULES_START_ID = 100000;
const DEFAULT_SETTINGS = {
  blockingEnabled: true,
  cosmeticEnabled: true,
  customDomains: []
};

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return stored;
}

async function setBlockingRulesetState(enabled) {
  if (enabled) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [STATIC_RULESET_ID]
    });
  } else {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: [STATIC_RULESET_ID]
    });
  }
}

function domainToRule(domain, id) {
  return {
    id,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "||" + domain + "^",
      resourceTypes: [
        "script",
        "image",
        "xmlhttprequest",
        "sub_frame",
        "media",
        "ping",
        "other",
        "stylesheet",
        "font"
      ]
    }
  };
}

async function syncCustomRules(customDomains, blockingEnabled) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existing.map((r) => r.id);

  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds
    });
  }

  if (!blockingEnabled) {
    return;
  }

  const cleanDomains = (customDomains || [])
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);

  const newRules = cleanDomains.map((domain, index) =>
    domainToRule(domain, CUSTOM_RULES_START_ID + index)
  );

  if (newRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules
    });
  }
}

async function applyAllSettings() {
  const settings = await getSettings();
  await setBlockingRulesetState(settings.blockingEnabled);
  await syncCustomRules(settings.customDomains, settings.blockingEnabled);
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  await chrome.storage.local.set(stored);
  await applyAllSettings();
  try {
    await chrome.declarativeNetRequest.setExtensionActionOptions({
      displayActionCountAsBadgeText: true
    });
  } catch (e) {
    /* not fatal if unsupported */
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await applyAllSettings();
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.blockingEnabled || changes.customDomains) {
    await applyAllSettings();
  }
});

async function getTabBlockedCount(tabId) {
  try {
    const result = await chrome.declarativeNetRequest.getMatchedRules({ tabId });
    return result.rulesMatchedInfo.length;
  } catch (e) {
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "GET_TAB_BLOCKED_COUNT") {
    const tabId = message.tabId;
    if (typeof tabId !== "number") {
      sendResponse({ count: null });
      return;
    }
    getTabBlockedCount(tabId).then((count) => {
      sendResponse({ count });
    });
    return true;
  }

  if (message && message.type === "APPLY_SETTINGS") {
    applyAllSettings().then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
