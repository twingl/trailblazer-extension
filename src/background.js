var StateManager = require('./core/state-manager');
var Keen = require('keen.io');


// @ifdef PRODUCTION
var REPORTING_ENABLED = true;
// @endif

// @ifndef PRODUCTION
var REPORTING_ENABLED = false;
// @endif

// @ifdef PRODUCTION
var CLIENT_ID = "a2042d508750087699fc5651f442dc6534fb8222125c29aba91b2c71d49e7061";
var API_HOST  = "https://app.trailblazer.io";
// @endif

// @ifndef PRODUCTION
var CLIENT_ID = "d3e24c417ab322f8189d47177748462d620781c24166419bb34ee04e35ffc785";
var API_HOST  = "http://staging.trailblazer.io";
// @endif


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

var keenClient = Keen.configure({
  requestType: "xhr",
  projectId: "54264ce280a7bd5b525ad712",
  writeKey: "efe90ef21a97678868e8fb2aa5f1bc3da9f5311f417c915058c9bdf1e24a2d75c65e39b2ab4290d406969087657880bc513d65625cec3f73e6ff232cb190113f9d163fbc16f001b8cea75ae15e4bbe255d9b16caf8e4376c405f40440147cda09fd7e3af3798491c2a318072e4a761f4"
});

var keenUserData = {};

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
  },
  default: {
    popup: "/ui/popup/unknown.html",
    browserAction: {
      19: "/ui/icons/19-unknown.png",
      38: "/ui/icons/38-unknown.png"
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
}

// Set the state of the popup when we change tabs
chrome.tabs.onActivated.addListener(function(activeInfo) {
  stateManager.isSignedIn().then(function (signedIn) {
    var node = Node.cache.read(stateManager._storageAdapter, stateManager._tabIdMap[activeInfo.tabId]);

    if (signedIn && node && node.recording) {
      // The extension is signed in and is recording the current page
      updateUIState(activeInfo.tabId, "recording");
    } else if (signedIn && node) {
      // The extension is signed in and idle
      updateUIState(activeInfo.tabId, "idle");
    } else if (signedIn) {
      updateUIState(activeInfo.tabId, "unknown");
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
    } else if (signedIn && node) {
      // The extension is signed in and idle
      updateUIState(activeInfo.tabId, "idle");
    } else if (signedIn) {
      updateUIState(tabId, "unknown");
    } else {
      // The extension is not signed in
      updateUIState(tabId, "notAuthenticated");
    }
  });
});

var stateManager = new StateManager({
  api: {
    host: API_HOST,
    clientId: CLIENT_ID,
    nameSpace: "api",
    version: "v1"
  },
  eventAdapter:    ChromeEventAdapter,
  identityAdapter: ChromeIdentityAdapter,
  storageAdapter: TrailblazerHTTPStorageAdapter
});

chrome.runtime.onInstalled.addListener(function(details) {
  switch(details.reason) {
    case "update":
      // Do stuff
      stateManager._identityAdapter.getToken().then(function(token) {
        stateManager._identityAdapter.storeToken(token);
      });
      break;
    case "install":
      // Show onboarding
      chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/ui/pages/welcome.html") });
      break;
    case "chrome_update":
      //
      break;
  }
});

// Set initial popup state
stateManager.isSignedIn().then(function (signedIn) {
  if (signedIn) {
    // Set the extension to Idle
    chrome.browserAction.setPopup({
      popup: extensionStates.idle.popup
    });
    chrome.browserAction.setIcon({
      path: extensionStates.idle.browserAction
    });

    //TODO fetch existing assignments and query which tabs are currently
    //recording, restoring their recording state where needed
  } else {
    // Set the extension to Idle
    chrome.browserAction.setPopup({
      popup: extensionStates.notAuthenticated.popup
    });
    chrome.browserAction.setIcon({
      path: extensionStates.notAuthenticated.browserAction
    });
  }
});

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  switch (request.action) {
    case 'getMap':
      stateManager.getMap(request.assignmentId, function(data) {
        sendResponse({data: data})
      })
      break;

    case 'getNode':
      if (request.nodeId) {
        var node = Node.cache.read(stateManager._storageAdapter, request.nodeId);
        sendResponse({node: node});
      } else if (request.tabId) {
        var node = stateManager.getNode(request.tabId);
        sendResponse({node: node});
      }
      break;

    case 'getNodes':
      var nodes = stateManager.nodes(request.assignmentId, function(nodes) {
        chrome.runtime.sendMessage({ action: "updatedNodes", assignmentId: request.assignmentId, updatedNodes: nodes });
      });
      chrome.runtime.sendMessage({ action: "updatedNodes", assignmentId: request.assignmentId, updatedNodes: nodes });
      break;

    case 'updateNode':
      var node = Node.cache.read(stateManager._storageAdapter, request.nodeId);

      if (node && request.props) {
        node = _.extend(node, request.props);
        node.save(stateManager._storageAdapter).then(function(updatedNode) {
          //unused
          chrome.runtime.sendMessage({action: 'updatedNode', updatedNode: updatedNode})
        })
      };
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
        chrome.runtime.sendMessage({action: 'updatedNodes', assignmentId: node.assignmentId});
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
      var mapUrlSubstring = "map.html#assignment=" + assignment.id;
      var nodes = stateManager.nodes(request.assignmentId);
      var nodeTabIds = _.pluck(nodes, 'tabId');

      if (assignment) {
        assignment.destroy(stateManager._storageAdapter).then(function() {
          chrome.tabs.query({ windowType: "normal" }, function(tabs) {
            _.each(tabs, function(tab, index) {
              if (_.contains(nodeTabIds, tab.id)) {
                var node = stateManager.getNode(tab.id);
                delete node.assignmentId;
                delete node.tabId;

                // Set up a new ID for the node (this will orhpan child nodes)
                node.id = node.tempId = Node._getId();

                // Reset the recording state of the node
                node.recording = false;

                // Broadcast an updated
                chrome.runtime.sendMessage({action: 'updatedNode', updatedNode: node})
              }

              // close tab if it is a map of the deleted assignment
              if (tab.url.indexOf(mapUrlSubstring) !== -1) {
                chrome.tabs.remove(tab.id);
              }
            });

            //broadcast updated assignments list
            chrome.runtime.sendMessage({ action: "getAssignments" });
          });
        });
      }
      break;

    case 'updateAssignment':
      var assignment = Assignment.cache.read(stateManager._storageAdapter, request.assignmentId);
      if (assignment && request.props) {
        assignment = _.extend(assignment, request.props);

        assignment.save(stateManager._storageAdapter).then(function(savedAssignment) {
          chrome.runtime.sendMessage({action: 'updatedAssignment', assignment: savedAssignment})
        });
      };
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
      stateManager.startRecording(request.tabId, request.assignmentId).then(
          function() {
            updateUIState(request.tabId, "recording");
            sendResponse({ success: true });
          },
          function() {
            sendResponse({ success: false });
          });
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

        keenUserData.token = token.token;
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
      stateManager._identityAdapter.getToken().then(function(token) {
        chrome.runtime.getPlatformInfo(function(platformInfo) {

          var keenEvent = request.eventData;

          keenEvent.token = token.access_token;
          keenEvent.userId = token.user_id;

          keenEvent.extensionVersion = chrome.runtime.getManifest().version;

          keenEvent.platformInfo = platformInfo;
          keenEvent.userAgent = navigator.userAgent;

          keenEvent.keen = { timestamp: new Date().toISOString() };

          if (REPORTING_ENABLED) {
            console.log("reporting event: " + request.eventName, keenEvent);
            keenClient.addEvent(request.eventName, keenEvent);
          } else {
            console.log("not reporting event: " + request.eventName, keenEvent);
          }
        });
      });
      break;
  }

  return true;
});


