var popupStates = require('./popup-states');

module.exports = function (tabId, state) {
  switch (state) {
    case "recording":
    case "notAuthenticated":
    case "idle":
      chrome.browserAction.setPopup({
        tabId: tabId,
        popup: popupStates[state].popup
      });
      chrome.browserAction.setIcon({
        tabId: tabId,
        path: popupStates[state].browserAction
      });
      break;
    case "unknown":
    default:
      chrome.browserAction.setPopup({
        tabId: tabId,
        popup: popupStates.default.popup
      });
      chrome.browserAction.setIcon({
        tabId: tabId,
        path: popupStates.default.browserAction
      });
  }
};