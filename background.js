// HeaderCheck · background
// Captures response headers for main-frame requests and serves latest per tab.

const latestHeadersByTab = {};

chrome.webRequest.onHeadersReceived.addListener(
  details => {
    if (details.type !== "main_frame") return;

    const tabId = details.tabId;
    if (tabId < 0) return;

    const headersMap = {};
    for (const h of details.responseHeaders || []) {
      const key = h.name.toLowerCase();
      const val = Array.isArray(h.value) ? h.value.join("; ") : h.value;
      headersMap[key] = val;
    }

    latestHeadersByTab[tabId] = {
      url: details.url,
      headers: headersMap,
      ts: Date.now()
    };

    chrome.storage.local.set({
      [`tab_${tabId}`]: latestHeadersByTab[tabId]
    });
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "getLatestForActiveTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs && tabs[0];
      if (!tab) {
        sendResponse({ ok: false, error: "no-active-tab" });
        return;
      }

      const tabKey = `tab_${tab.id}`;
      chrome.storage.local.get(tabKey, data => {
        sendResponse({
          ok: true,
          data: data[tabKey] || null
        });
      });
    });
    return true; // async response
  }
});
