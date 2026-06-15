importScripts("js/utils.js");

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case "whoAmI":
      sendResponse({ tab: sender.tab.id });
      break;
  }
});

// Drop a tab's data when it's closed to prevent storage bloat.
chrome.tabs.onRemoved.addListener(function (tabId) {
  chrome.storage.local.remove(tabId.toString(), function () {
    if (chrome.runtime.lastError) {
      console.error(
        "Patreon Downloader | Failed to clear data for closed tab.",
        tabId,
        chrome.runtime.lastError.message,
      );
    }
  });
});

// Tab ids reset between browser sessions, so entries left by tabs closed while
// the worker wasn't running (or during a browser restart) are never caught by
// onRemoved above. Sweep them on startup/install by removing any stored key that
// has no matching open tab.
function sweepOrphanedTabData() {
  chrome.tabs.query({}, function (tabs) {
    const openTabIds = tabs.map((tab) => tab.id);
    chrome.storage.local.get(null, function (items) {
      const orphanKeys = findOrphanedTabKeys(Object.keys(items), openTabIds);
      if (!orphanKeys.length) return;

      chrome.storage.local.remove(orphanKeys, function () {
        if (chrome.runtime.lastError) {
          console.error(
            "Patreon Downloader | Failed to sweep orphaned tab data.",
            chrome.runtime.lastError.message,
          );
        } else {
          console.log("Patreon Downloader | Swept orphaned tab data.", orphanKeys);
        }
      });
    });
  });
}

chrome.runtime.onStartup.addListener(sweepOrphanedTabData);
chrome.runtime.onInstalled.addListener(sweepOrphanedTabData);
