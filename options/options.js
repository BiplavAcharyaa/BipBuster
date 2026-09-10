const DEFAULT_SETTINGS = {
  blockingEnabled: true,
  cosmeticEnabled: true,
  customDomains: []
};

const blockingToggle = document.getElementById("blockingToggle");
const cosmeticToggle = document.getElementById("cosmeticToggle");
const domainInput = document.getElementById("domainInput");
const addDomainBtn = document.getElementById("addDomainBtn");
const domainList = document.getElementById("domainList");
const savedMessage = document.getElementById("savedMessage");

function showSaved() {
  savedMessage.textContent = "Saved";
  setTimeout(() => {
    savedMessage.textContent = "";
  }, 1200);
}

function isValidDomain(domain) {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(domain);
}

function renderDomainList(domains) {
  domainList.innerHTML = "";
  domains.forEach((domain) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = domain;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      removeDomain(domain);
    });

    li.appendChild(span);
    li.appendChild(removeBtn);
    domainList.appendChild(li);
  });
}

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    blockingToggle.checked = settings.blockingEnabled;
    cosmeticToggle.checked = settings.cosmeticEnabled;
    renderDomainList(settings.customDomains || []);
  });
}

function addDomain() {
  const raw = domainInput.value.trim().toLowerCase();
  if (!raw) return;

  if (!isValidDomain(raw)) {
    savedMessage.textContent = "Enter a valid domain, e.g. example.com";
    savedMessage.style.color = "#d93025";
    setTimeout(() => {
      savedMessage.textContent = "";
      savedMessage.style.color = "#188038";
    }, 1800);
    return;
  }

  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    const domains = settings.customDomains || [];
    if (domains.includes(raw)) {
      domainInput.value = "";
      return;
    }
    const updated = [...domains, raw];
    chrome.storage.local.set({ customDomains: updated }, () => {
      renderDomainList(updated);
      domainInput.value = "";
      showSaved();
    });
  });
}

function removeDomain(domain) {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    const updated = (settings.customDomains || []).filter((d) => d !== domain);
    chrome.storage.local.set({ customDomains: updated }, () => {
      renderDomainList(updated);
      showSaved();
    });
  });
}

blockingToggle.addEventListener("change", () => {
  chrome.storage.local.set({ blockingEnabled: blockingToggle.checked }, showSaved);
});

cosmeticToggle.addEventListener("change", () => {
  chrome.storage.local.set({ cosmeticEnabled: cosmeticToggle.checked }, showSaved);
});

addDomainBtn.addEventListener("click", addDomain);

domainInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addDomain();
  }
});

loadSettings();
