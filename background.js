function generateApiKey() {
  // 32-char random hex string
  return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Ensure API key exists on startup
chrome.storage.local.get(['apiKey'], (result) => {
  if (!result.apiKey) {
    const apiKey = generateApiKey();
    chrome.storage.local.set({ apiKey });
    console.log('Generated new API key:', apiKey);
  }
});


let currentTab = null;
let lastTimestamp = Date.now();

function isTrackable(tab) {
  return (
    tab &&
    tab.url &&
    !tab.url.startsWith("chrome://") &&
    !tab.url.startsWith("chrome-extension://")
  );
}

function updateTime() {
  if (!isTrackable(currentTab)) return;
  const now = new Date();
  const timeSpent = now - lastTimestamp;
  lastTimestamp = now;

  
  const dateKey = now.toISOString().split('T')[0]; // e.g., "2025-06-23"
  const hostname = new URL(currentTab.url).hostname;
  const key = `${hostname}::${dateKey}`;


  chrome.storage.local.get([key], (result) => {
    const total = result[key] || 0;
    const apiKey = result.apiKey;
  chrome.storage.local.set({ [key]: total + timeSpent });
  });
}

// On tab activated (user switches tabs)
chrome.tabs.onActivated.addListener(({ tabId }) => {
  updateTime();
  chrome.tabs.get(tabId, (tab) => {
    currentTab = tab;
    lastTimestamp = Date.now();
  });
});

// On tab updated (e.g., page finishes loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    updateTime();
    currentTab = tab;
    lastTimestamp = Date.now();
  }
});

// On window focus change (user switches away from Chrome)
chrome.windows.onFocusChanged.addListener(() => {
  updateTime();
  currentTab = null;
});

// On idle/locked (user steps away from device)
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") {
    updateTime();
    currentTab = null;
  }
});
