var actions = require('../actions');

chrome.tabs.onCreated.addListener( function(tab) {
  actions.tabCreated(tab.id, tab.url, tab.title, tab.openerTabId, tab);
});

chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
  // filter the update events, so only url/title etc. changes are fired
  actions.tabUpdated(tabId, tab.url, tab.title, tab);
});

chrome.tabs.onRemoved.addListener( function(tabId, removeInfo) {
  actions.tabClosed(tabId);
});

chrome.webNavigation.onHistoryStateUpdated.addListener( function(details) {
  if (details.frameId === 0) {
    actions.historyStateUpdated(
        details.tabId,
        details.url,
        details.transitionType,
        details.transitionQualifiers,
        details.timestamp);
  }
});

chrome.webNavigation.onTabReplaced.addListener( function(details) {
  actions.tabReplaced(details.replacedTabId, details.tabId, timestamp);
});

chrome.webNavigation.onCreatedNavigationTarget.addListener( function(details) {
  actions.createdNavigationTarget(
      details.sourceTabId,
      details.tabId,
      details.url,
      details.timestamp);
});

chrome.webNavigation.onCommitted.addListener( function(details) {
  if (details.frameId === 0) {
    actions.webNavCommitted(details.tabId,
        details.url,
        details.transitionType,
        details.transitionQualifiers,
        details.timestamp);
  }
});
