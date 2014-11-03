var extensionStates = require('./extension-states');

module.exports = function (tabId, state) {
  switch (state) {
    case "recording":
    case "notAuthenticated":
    case "idle":
      chrome.browserAction.setPopup({
        tabId: tabId,
        popup: extensionStates[state].popup
      });
      chrome.browserAction.setIcon({
        tabId: tabId,
        path: extensionStates[state].browserAction
      });
      break;
    case "unknown":
    default:
      chrome.browserAction.setPopup({
        tabId: tabId,
        popup: extensionStates.default.popup
      });
      chrome.browserAction.setIcon({
        tabId: tabId,
        path: extensionStates.default.browserAction
      });
  }
};