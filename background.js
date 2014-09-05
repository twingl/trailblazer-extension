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
      clientId: "a2042d508750087699fc5651f442dc6534fb8222125c29aba91b2c71d49e7061",
      nameSpace: "api",
      version: "v1"
    },
    eventAdapter:    ChromeEventAdapter,
    identityAdapter: ChromeIdentityAdapter,
    storageAdapter: TrailblazerHTTPStorageAdapter
  });

  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    switch (request.action) {
      case 'getLog': /** @deprecated */
        sendResponse({ data: actions.getLog() });
        break;

      /**
       * Retrieve a list of assignments from the state manager and send a
       * message with these to any listeners.
       *
       * This will cause two messages: one containing the cached copy of
       * assignments (before the request is made to the server to retrieve an
       * up to date list), and one after the request has been made. Will
       * contain an empty array if the cache has not yet been filled.
       *
       * The message sent is:
       * ```javascript
       * {
       *   updatedAssignments: Array<Assignment>
       * }
       * ```
       *
       * @function BackgroundJS.getAssignments
       */
      case 'getAssignments':
        var assignments = stateManager.assignments(function(assignments) {
          chrome.runtime.sendMessage({ updatedAssignments: assignments });
        });
        chrome.runtime.sendMessage({ updatedAssignments: assignments });
        break;

      /**
       * Start recording a tab and its children's activity.
       * An optional assignmentId can be supplied if an assignment exists,
       * otherwise one will be created.
       *
       * Message should be in the format:
       * ```javascript
       * {
       *   action: 'startRecording',
       *   tabId: number,
       *   assignmentId: number
       * }
       * ```
       *
       * @function BackgroundJS.recordTab
       */
      case 'startRecording':
        stateManager.startRecording(request.tabId, request.assignmentId);
        break;

      /**
       * Sign in to Trailblazer. If successful, the response will be a single
       * boolean `true`, otherwise `false`
       * @function BackgroundJS.signIn
       */
      case 'signIn':
        stateManager.signIn().then(function(token) {
          sendResponse(true);
        }, function() {
          sendResponse(false);
        });
        break;

      /**
       * Retrieve the state of authentication. Responds with a single boolean
       * `true` if authenticated, otherwise `false`
       * @function BackgroundJS.signedIn?
       */
      case 'signedIn?':
        stateManager.isSignedIn().then(sendResponse);
        break;

      /**
       * Sign out. If successful, the response will be a single boolean `true`,
       * otherwise `false`
       * @function BackgroundJS.signOut
       */
      case 'signOut':
        stateManager.signOut().then(function() {
          sendResponse(true);
        }, function() {
          sendResponse(false);
        });
        break;
    }

    return true;
  });

})();
