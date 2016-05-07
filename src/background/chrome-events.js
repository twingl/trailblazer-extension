import actions from '../actions';

// Initialize our logger
import Logger from '../util/logger';
var logger = Logger('background/chrome-events.js');

export default function bind(flux) {
  actions.setMessageSender(function(message) {
    if (message.action) {
      var e = {
        type: message.action,
        payload: message.payload || {}
      }
      flux.dispatcher.dispatch(e);
      logger.info("Dispatched CrEvent", e);
    }
  })


  chrome.tabs.onCreated.addListener(function(tab) {
    actions.tabCreated(tab.id, tab.url, tab.title, tab.openerTabId, tab);
  });

  chrome.tabs.onActivated.addListener(function(focusInfo) {
    actions.tabFocused(focusInfo.tabId);
  });

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // filter the update events, so only url/title etc. changes are fired
    if (changeInfo.url) {
      actions.tabUpdated(tabId, changeInfo.url, tab.title, tab);
    }
  });

  chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    actions.tabClosed(tabId);
  });

  chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if (details.frameId === 0) {
      actions.historyStateUpdated(
          details.tabId,
          details.url,
          details.transitionType,
          details.transitionQualifiers,
          details.timestamp);
    }
  });

  chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
    actions.tabReplaced(addedTabId, removedTabId);
  });

  chrome.webNavigation.onCreatedNavigationTarget.addListener(function(details) {
    actions.createdNavigationTarget(
        details.sourceTabId,
        details.tabId,
        details.url,
        details.timestamp);
  });

  chrome.webNavigation.onCommitted.addListener(function(details) {
    if (details.frameId === 0) {
      actions.webNavCommitted(details.tabId,
          details.url,
          details.transitionType,
          details.transitionQualifiers,
          details.timestamp);
    }
  });
}
