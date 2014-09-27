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

  // Disable reporting in development
  var REPORTING_ENABLED = false;

  var keenClient = new Keen({
    requestType: "xhr",
    projectId: "54264ce280a7bd5b525ad712",
    writeKey: "efe90ef21a97678868e8fb2aa5f1bc3da9f5311f417c915058c9bdf1e24a2d75c65e39b2ab4290d406969087657880bc513d65625cec3f73e6ff232cb190113f9d163fbc16f001b8cea75ae15e4bbe255d9b16caf8e4376c405f40440147cda09fd7e3af3798491c2a318072e4a761f4"
  });

  /**
   * @property {Object} BackgroundJS.popupStates
   */
  var extensionStates = {
    recording: {
      popup: "/ui/popup/recording.html",
      browserAction: {
        19: "/ui/icons/19-recording.png",
        38: "/ui/icons/38-recording.png"
      }
    },
    idle: {
      popup: "/ui/popup/idle.html",
      browserAction: {
        19: "/ui/icons/19.png",
        38: "/ui/icons/38.png"
      }
    },
    notAuthenticated: {
      popup: "/ui/popup/not_authenticated.html",
      browserAction: {
        19: "/ui/icons/19.png",
        38: "/ui/icons/38.png"
      }
    }
  };

  var updateUIState = function (tabId, state) {
    switch (state) {
      case "recording":
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.recording.popup
        });
        chrome.browserAction.setIcon({
          tabId: tabId,
          path: extensionStates.recording.browserAction
        });
        break;

      case "notAuthenticated":
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.notAuthenticated.popup
        });
        chrome.browserAction.setIcon({
          tabId: tabId,
          path: extensionStates.notAuthenticated.browserAction
        });
        break;

      case "idle":
        chrome.browserAction.setPopup({
          tabId: tabId,
          popup: extensionStates.idle.popup
        });
        chrome.browserAction.setIcon({
          tabId: tabId,
          path: extensionStates.idle.browserAction
        });
        break;

    }
  }

  // Set the state of the popup when we change tabs
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    stateManager.isSignedIn().then(function (signedIn) {
      var node = Node.cache.read(stateManager._storageAdapter, stateManager._tabIdMap[activeInfo.tabId]);

      if (signedIn && node && node.recording) {
        // The extension is signed in and is recording the current page
        updateUIState(activeInfo.tabId, "recording");
      } else if (signedIn) {
        // The extension is signed in and idle
        updateUIState(activeInfo.tabId, "idle");
      } else {
        // The extension is not signed in
        updateUIState(activeInfo.tabId, "notAuthenticated");
      }
    });
  });

  // Set the state of the popup a tab is updated
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    stateManager.isSignedIn().then(function (signedIn) {
      var node = Node.cache.read(stateManager._storageAdapter, stateManager._tabIdMap[tabId]);

      if (signedIn && node && node.recording) {
        // The extension is signed in and is recording the current page
        updateUIState(tabId, "recording");
      } else if (signedIn) {
        // The extension is signed in and idle
        updateUIState(tabId, "idle");
      } else {
        // The extension is not signed in
        updateUIState(tabId, "notAuthenticated");
      }
    });
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
      case 'getMap':
        stateManager.getMap(request.assignmentId, function(data) {
          sendResponse({data: data})
        })
        break;

      case 'getNodes':
        var nodes = stateManager.nodes(request.assignmentId, function(nodes) {
          chrome.runtime.sendMessage({ action: "updatedNodes", assignmentId: request.assignmentId, updatedNodes: nodes });
        });
        chrome.runtime.sendMessage({ action: "updatedNodes", assignmentId: request.assignmentId, updatedNodes: nodes });
        break;

      /**
       * Resume an assignment (implied from the Node) by opening a new Tab in
       * the current window based on the Node referred to by the specified Node
       * ID
       *
       * With the Node ID specified, a new Tab will be opened on that Node's URL
       * and be set to a recording state.
       *
       * The message should be of the form:
       * ```javascript
       * {
       *   action: 'resumeAssignment',
       *   nodeId: number
       * }
       * ```
       *
       * @function BackgroundJS.resumeAssignment
       */
      case 'resumeAssignment':
        var node = Node.cache.read(stateManager._storageAdapter, request.nodeId);
        var focus = request.focus || false;
        chrome.tabs.create({ url: node.url, active: focus }, function(tab) {
          stateManager.resumeRecording(tab.id, request.nodeId);
        });
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
          chrome.runtime.sendMessage({
            action: "updatedAssignments",
            updatedAssignments: assignments
          });
        });
        chrome.runtime.sendMessage({
          action: "updatedAssignments",
          updatedAssignments: assignments
        });
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
        if (node && node.assignmentId && node.recording) {
          var assignment = Assignment.cache.read(stateManager._storageAdapter, node.assignmentId);
          sendResponse(assignment || false);
        } else {
          sendResponse(false);
        }
        break;

      case 'destroyAssignment':
        var assignment = Assignment.cache.read(stateManager._storageAdapter, request.assignmentId);

        if (assignment) {
          assignment.destroy(stateManager._storageAdapter).then(function() {
            chrome.runtime.sendMessage({ action: "getAssignments" });
          });
        }
        break;


      case 'updateAssignment':
        var assignment = Assignment.cache.read(stateManager._storageAdapter, request.assignmentId);

        //only handles updating title
        if (assignment) {
          assignment.title = request.newTitle
          assignment.save(stateManager._storageAdapter).then(function(savedAssignment) {
            chrome.runtime.sendMessage({action: 'updatedAssignment', assignment: savedAssignment})
          })

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
        updateUIState(request.tabId, "recording");
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
        updateUIState(request.tabId, "idle");
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
          chrome.browserAction.setIcon({ path: extensionStates.idle.browserAction });
          chrome.windows.getCurrent({ populate: true }, function(win) {
            var tab = _.findWhere(win.tabs, { active: true });
            if (tab) updateUIState(tab.id, "idle");
          });
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
          chrome.browserAction.setPopup({ popup: extensionStates.notAuthenticated.popup });
          chrome.browserAction.setIcon({ path: extensionStates.notAuthenticated.browserAction });
          chrome.windows.getCurrent({ populate: true }, function(win) {
            var tab = _.findWhere(win.tabs, { active: true });
            if (tab) updateUIState(tab.id, "notAuthenticated");
          });
          sendResponse(true);
        }, function() {
          sendResponse(false);
        });
        break;

      /**
       * Tracks a UI event, sending details to Keen.
       * @function BackgroundJS.trackUIEvent
       */
      case 'trackUIEvent':
        chrome.storage.sync.get("token", function(token) {
          var keenEvent = request.eventData;

          try {
            keenEvent.token = JSON.parse(token.token).access_token;
          } catch (e) {
            keenEvent.token = "invalid_or_error";
          }

          keenEvent.keen = { timestamp: new Date().toISOString() };

          if (REPORTING_ENABLED) {
            console.log("reporting event: " + request.eventName, keenEvent);
            keenClient.addEvent(request.eventName, keenEvent);
          } else {
            console.log("not reporting event: " + request.eventName, keenEvent);
          }
        });
        break;
    }

    return true;
  });

})();
