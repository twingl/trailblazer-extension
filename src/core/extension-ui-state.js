import ChromeIdentityAdapter from '../adapter/chrome_identity_adapter';
import extensionStates from './extension-states';

/**
 * Sets the initial extension UI state based on authentication state
 */
export function init() {
  new ChromeIdentityAdapter().isSignedIn().then((signedIn) => {
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
};

  /**
   * Updates the extension state on the supplied tab ID
   */
export function update(tabId, state) {
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
};

export default { init, update };
