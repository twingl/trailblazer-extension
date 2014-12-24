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
