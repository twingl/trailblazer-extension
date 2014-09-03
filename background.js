(function () {
  'use strict';

  /**
   * **This is not an actual class, and functions documented here are actually
   * chrome.runtime messages**
   *
   * background.js is the "main.c" equivalent - it is responsible for creating
   * an instance of {@link StateManager} and wiring up handlers for messages
   * that originate from the UI.
   *
   * @class BackgroundJS
   * @classname BackgroundJS
   */

  /** @deprecated */
  var activityLog = [];

  /** @deprecated */
  var previousTabId = undefined;

  /** @deprecated */
  var currentTabId = undefined;

  /** @deprecated */
  var actions = {
    getLog: function() {
      return { nodes: stateManager.nodes };
    }
  };
  var stateManager = new StateManager({
    api: {
      host: "https://app.trailblazer.io",
      nameSpace: "api",
      version: "v1",
      clientId: "a2042d508750087699fc5651f442dc6534fb8222125c29aba91b2c71d49e7061"
    },
    eventAdapter:    ChromeEventAdapter,
    identityAdapter: ChromeIdentityAdapter
  });

  stateManager.isSignedIn().then(function(isSignedIn) {
    if (!isSignedIn) {
      stateManager.signIn().then(
          function(r) { console.log("resolve", r); },
          function(r) { console.log("reject", r); });
    }
  });

  console.log(stateManager);

  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log(request);
    switch (request.action) {
      case 'getLog': /** @deprecated */
        sendResponse({ data: actions.getLog() });
        break;

      /**
       * Sign in to Trailblazer. See {@link ChromeIdentityAdapter#signIn} for
       * details)
       * @function BackgroundJS.signIn
       */
      case 'signIn':
        sendResponse(stateManager.signIn());
        break;

      /**
       * Sign out. See {@link ChromeIdentityAdapter#signOut} for details)
       * @function BackgroundJS.signOut
       */
      case 'signOut':
        sendResponse(stateManager.signOut());
        break;
    }
  });

})();
