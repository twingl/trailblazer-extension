var actions = require('../actions');

chrome.runtime.onMessage.addListener(function(message, senderInfo, respond) {
  if (message.type === "content_script" && message.role === "title") {
    var tabId = senderInfo.tab.id;
    actions.tabTitleUpdated(tabId, message.payload.url, message.payload.title);
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener( function(details) {
  if (details.frameId === 0) {
    window.setTimeout( function() {
      chrome.tabs.executeScript(details.tabId, { file: "/build/page-title.js" });
    }, 1000);
    // FIXME detecting page title changes for SPAs
    // SPA sites use this hook as they don't fire the DOM content loaded event
    // on page navigation. They do, however, change the history state so we can
    // listen for that. Unfortunately the title often changes after that event,
    // so we back off for a second before running the content script. If after
    // that duration it isn't updated, then it's incorrect and we're going to
    // have a bad time. Need to find a better way of addressing this one.
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener( function (details) {
  if (details.frameId === 0) {
    chrome.tabs.executeScript(details.tabId, { file: "/build/page-title.js" });
  }
});

