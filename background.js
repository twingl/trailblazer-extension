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

  /**
   * @property {Object} BackgroundJS.popupStates
   */
  var extensionStates = {
    recording: {
      popup: "/ui/popup/recording.html",
      browserAction: ""
    },
    idle: {
      popup: "/ui/popup/idle.html",
      browserAction: ""
    },
    notAuthenticated: {
      popup: "/ui/popup/not_authenticated.html",
      browserAction: ""
    }
  };

  var updateUIState = function (tabId) {
    stateManager.isSignedIn().then(function (signedIn) {
      var node = Node.cache.read(stateManager._storageAdapter, stateManager._tabIdMap[tabId]);

      if (signedIn && node && node.recording) {
        // The extension is signed in and is recording the current page
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.recording.popup
        });
      } else if (signedIn) {
        // The extension is signed in and idle
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.idle.popup
        });
      } else {
        // The extension is not signed in
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.notAuthenticated.popup
        });
      }
    });
  }

  // Set the state of the popup when we change tabs
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    updateUIState(activeInfo.tabId);
  });

  // Set the state of the popup a tab is updated
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updateUIState(tabId);
  });

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

  // Set initial popup state
  stateManager.isSignedIn().then(function (signedIn) {
    if (signedIn) {
      // Set the extension to Idle
      chrome.browserAction.setPopup({ popup: extensionStates.idle.popup });

      //TODO fetch existing assignments and query which tabs are currently
      //recording, restoring their recording state where needed
    }
  });

  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    switch (request.action) {
      case 'getLog': /** @deprecated */
        sendResponse({ data: stateManager.getMap(request.assignmentId) });
        break;

      /**
       * Resume an assignment (implied from the Node) by adding a new node to
       * the tree based on the specified Tab ID, or by opening a new Tab in the
       * current window based on the Node referred to by the specified Node ID
       *
       * If a Node ID is specified, a new Tab will be opened on that Node's URL
       * and be set to a recording state.
       *
       * If a Tab ID is specified, the Tab will be added to the map on its own
       * with its current details.
       *
       * If both are specified, the Tab ID will be ignored.
       *
       * The message should be of the form:
       * ```javascript
       * {
       *   action: 'resumeAssignment',
       *   tabId: number, (not requred if nodeId specified)
       *   nodeId: number (not requred if tabId specified, takes preference)
       * }
       * ```
       *
       * @function BackgroundJS.resumeAssignment
       */
      case 'resumeAssignment':
        if (request.nodeId) {
          var node = Node.cache.read(stateManager._storageAdapter, request.nodeId);
          chrome.windows.create({ url: node.url }, function(tab) {
            stateManager.resumeRecording(tab.id, request.nodeId);
          });
        } else if (request.tabId) {
          stateManager.startRecording(request.tabId, requst.assignmentId);
        }
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
       * Retrieve the current assignment and send a response with either the
       * assignment or false.
       *
       * @function BackgroundJS.getCurrentAssignment
       * @TODO Accessing temporary Assignment implementation
       */
      case 'getCurrentAssignment':
        var node = stateManager.getCurrentNode();
        if (node.assignmentId && node.recording) {
          var assignment = Assignment.cache.read(stateManager._storageAdapter, node.assignmentId);
          sendResponse(assignment || false);
        } else {
          sendResponse(false);
        }
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
       * @function BackgroundJS.startRecording
       */
      case 'startRecording':
        chrome.browserAction.setPopup({
          tabId: request.tabId,
          popup: extensionStates.recording.popup
        });
        stateManager.startRecording(request.tabId, request.assignmentId);
        sendResponse();
        break;

      /**
       * Stop recording a given tab/node. This will prevent any potential
       * children from being included in the tree.
       *
       * Message should be in the format:
       * ```javascript
       * {
       *   action: 'stopRecording',
       *   tabId: number
       * }
       * ```
       *
       * @function BackgroundJS.stopRecording
       */
      case 'stopRecording':
        chrome.browserAction.setPopup({
          tabId: request.tabId,
          popup: extensionStates.idle.popup
        });
        stateManager.stopRecording(request.tabId);
        sendResponse();
        break;

      /**
       * Sign in to Trailblazer. If successful, the response will be a single
       * boolean `true`, otherwise `false`
       * @function BackgroundJS.signIn
       */
      case 'signIn':
        stateManager.signIn().then(function(token) {
          chrome.browserAction.setPopup({ popup: extensionStates.idle.popup });
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
