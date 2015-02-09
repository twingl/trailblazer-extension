var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , extensionStates = require('./extension-states');

module.exports = {
  /**
   * Sets the initial extension UI state based on authentication state
   */
  init: function () {
    new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
      if (signedIn) {
        // Set the extension to Idle
        chrome.browserAction.setIcon({
          path: extensionStates.idle.browserAction
        });

        //TODO fetch existing assignments and query which tabs are currently
        //recording, restoring their recording state where needed
      } else {
        // Set the extension to Idle
        chrome.browserAction.setIcon({
          path: extensionStates.notAuthenticated.browserAction
        });
      }
    });
  },

  /**
   * Updates the extension state on the supplied tab ID
   */
  update: function (tabId, state) {
    switch (state) {
      case "recording":
      case "notAuthenticated":
      case "idle":
        chrome.browserAction.setIcon({
          tabId: tabId,
          path: extensionStates[state].browserAction
        });
        break;
      case "unknown":
      default:
        chrome.browserAction.setIcon({
          tabId: tabId,
          path: extensionStates.default.browserAction
        });
    }
  }
};
