// models
var Node                  = require('../model/node')
  , Assignment            = require('../model/assignment');

// adapters
var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , ChromeEventAdapter    = require('../adapter/chrome_event_adapter')
  , tabIdMap              = require('./tab-id-map');

var extensionStates       = require('./extension-states');

var startRecording        = require('../lib/start-recording');


//actions
var getNode               = require('../lib/get-node');

//events 
// var Fluxxor               = require('fluxxor');
// var eventManager          = require('./event-manager');

//helpers
var _                     = require('lodash')
  , Promise               = require('promise')

//constants
var DEBOUNCE_MS = 700;

var StateManager = function() {

  /**
   * @property {number} _currentTabId - Tab ID of the tab that is currently
   * focused
   * @private
   */
  //DEPRECATED 
  // extensionStates.currentTabId = undefined;

  /**
   * @property {EventAdapter} _eventAdapter - The instance of the
   * EventAdapter being used to receive events
   * @private
   */
  this._eventAdapter = new ChromeEventAdapter();

  /**
   * @property {IdentityAdapter} _identityAdapter - The instance of the
   * IdentityAdapter being used for authentication
   * @private
   */
  this._identityAdapter = new ChromeIdentityAdapter();

  /**
   * @property {Array} _eventBuffer - Buffer into which events are pushed
   * from the event adapter. Periodically cleared and processed into nodes.
   * @private
   */
  this._eventBuffer = [];

  // Register StateManager's event handlers with the EventAdapter
  this._bindEvent("onCreatedTab");
  this._bindEvent("onUpdatedTab");
  this._bindEvent("onSwitchedTab");
  this._bindEvent("onClosedTab");
  this._bindEvent("onBeforeRedirect");

  // Indicate to the EventAdapter that we're ready to start listening for
  // events. Pass in `true` so that we get the initial browser state.
  this._eventAdapter.ready(true);
};

 //DEPRECATED
StateManager.prototype.getMap = function(assignmentId, callback) {
  var data = {
    nodes: {},
    assignment: Assignment.cache.read(assignmentId),
  };

  // Make a copy of the node store
  var tmp = {};
  _.extend(tmp, Node.cache.list(assignmentId));

  // Form a Map<Node.id, Node>
  _.each(tmp, function(node, key) { data.nodes[node.id] = node; });

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // two(!) methods to ensure opentabs are emphasised in UI 
    //get currently open tab urls
    var tabUrls = _.pluck(tabs, 'url');
    _.each(data.nodes, function(node, id) {
      var index = tabUrls.indexOf(node.url);
      if (index > -1) {
      //if node url matches open tab url set the node.tabId property
        data.nodes[id].tabId = tabs[index].id;
      };
    });

    // If any tabs are open as shown in tabIdMap, set them as properties on the nodes
    _.each(tabIdMap, function(map, key) {
      if (data.nodes[map]) {
        data.nodes[map].tabId = key;
      }
    });

    return callback(data);
  });
};

/**
 * Accessor function to get a cached copy of the assignments (if any), and
 * pass an updated copy of the list to an optional callback function
 * @function StateManager#assignments
 * @param {function} callback - Will be called with an updated list of
 * assignments from the server
 */
 //DEPRECATED
StateManager.prototype.assignments = function(cb) {
  Assignment.list().then(function(assignments) {
    cb(assignments);
  });
  return Assignment.cache.list();
};


/**
 * Accessor function to get a cached copy of the nodes (if any), and
 * pass an updated copy of the list to an optional callback function
 * @function StateManager#nodes
 * @param {function} callback - Will be called with an updated list of
 * nodes from the server
 */
StateManager.prototype.nodes = function(assignmentId, cb) {
  Node.list(assignmentId).then(function(nodes) {
    cb(nodes);
  });
  return Node.cache.list(assignmentId);
};

/**
 * Start recording the activity of a Tab.
 *
 * This method is intended to start recording on Tabs "manually" - that is,
 * not a child of a recorded tab.
 *
 * Not specifying an assignmentId will create a new assignment automatically.
 *
 * @function StateManager#startRecording
 * @param {number} tabId - The ID of the Tab to start recording
 * @param {number} assignmentId - the ID of the Assignment to record to
 */
//DEPRECATED 
StateManager.prototype.startRecording = function(tabId, assignmentId) {
  if (!getNode(tabId).recording) {
    var assignment;
    if (assignmentId) {
      // It's an existing assignment
      assignment = Assignment.cache.read(assignmentId);
    } else {
      // We need to create a new assignment
      assignment = new Assignment();
    }

    assignment.currentNodeId = getNode(tabId).id;

    // Ensure we have a valid ID for the assignment so we can start saving
    // the trail
    return new Promise(function(resolve, reject) {
      assignment.save().then(function(assignment) {
        getNode(tabId).assignmentId = assignment.id;
        getNode(tabId).recording = true;
        getNode(tabId).save();
        // TODO Feature? Iterate over the existing, in-memory nodes and save the
        // connected graph - this will save the entire tree, if desirable.
        // Pending team discussion
        resolve();
      }.bind(this),
      function() {
        reject();
      });
    }.bind(this));
  }
};

/**
 * Stop recording a Tab's activity.
 *
 * @function StateManager#stopRecording
 * @param {number} tabId - the ID of the Tab to stop monitoring
 */
//DEPRECATED  
StateManager.prototype.stopRecording = function(tabId) {
  getNode(tabId).recording = false;
};

/**
 * Resume recording a trail on a given node and tab.
 *
 * Inserts an event in the buffer to be handled by {@link
 * StateManager#resumedNode()}
 *
 * @function StateManager#resumeRecording
 * @param {number} tabId - The ID of the Tab to use
 * @param {number} nodeId - The ID of the Node to navigate to
 */
StateManager.prototype.resumeRecording = function(tabId, nodeId) {
  var tabEvent = {
    type: "resumed_node",
    occurred: Date.now(),
    data: {
      tabId: tabId,
      nodeId: nodeId
    }
  };
  this._eventBuffer.push(tabEvent);
  this._flushBuffer();
};

/**
 * @TODO Get info about the specified tab, including its recording state, which
 * Node it corresponds to and which Project it belongs to (if applicable).
 *
 * ```javascript
 * {
 *   recording: true,
 *   assignmentId: 4,
 *   nodeId: 82
 * }
 * ```
 *
 * @function StateManager#getTabInfo
 * @param {number} tabId - The ID of the Tab to get information about
 * @returns {Object}
 */
StateManager.prototype.getTabInfo = function(tabId) {};

//DEPRECATED
StateManager.prototype.getNode = function(tabId) {
  var node = undefined,
      nodeId = tabIdMap[tabId];

  if (nodeId) {
    // Return the existing Node
    node = Node.cache.read(nodeId);
  } else {
    // Create and map the Tab ID to a new Node
    node = new Node();
    tabIdMap[tabId] = node.id;
  }

  return node;
};

/**
 * Returns the Node corresponding to the currently focused tab.
 *
 * @function StateManager#getCurrentNode
 * @returns {Node} Returns the node if found, otherwise `null`
 */
StateManager.prototype.getCurrentNode = function() {
  var nodeId = tabIdMap[extensionStates.currentTabId];

  if (nodeId) {
    return Node.cache.read(nodeId);
  } else {
    return null;
  }
};

/**
 * Flushes the StateManager's event buffer and processes it, inserting new
 * nodes and updating as necessary.
 * De-bounced.
 * @TODO Re-evaluate whether buffering these events is necessary
 *
 * @function StateManager#_flushBuffer
 * @private
 */
//DEPRECATED
StateManager.prototype._flushBuffer = _.debounce( function() {
  //Move the event buffer into a local variable (sorted by ID) and reset it
  //ready for the next flush
  //FIXME Making the assumption that parentTabId will reference an ID less
  //than its own tabId
  var buffer = _.sortBy(this._eventBuffer, function(d) { return d.data.tabId });
  this._eventBuffer.length = 0;

  // Iterate over the sorted buffer, finding and updating (or creating) the
  // node for each event
  _.each(buffer, function(evt) {
    switch (evt.type) {
      case "created_tab":
        this.createdTab(evt);
        break;
      case "updated_tab":
        this.updatedTab(evt);
        break;
      case "switched_tab":
        this.switchedTab(evt);
        break;
      case "closed_tab":
        this.closedTab(evt);
        break;
      case "resumed_node":
        this.resumedNode(evt);
        break;
      case "redirect_pending":
        this.redirectPending(evt);
        break;
    }
  }.bind(this));

}, DEBOUNCE_MS );

/**
 * Called when a tab creation event is processed by _flushBuffer.
 *
 * Inserts a new Node into the graph, connected to the currentNode under the
 * right conditions.
 *
 * If a node is being resumed, it will ensure the node is mapped to the tab
 *
 * @function StateManager#createdTab
 * @param {Object} evt - The event object emitted by `eventAdapter`
 * @private
 */
StateManager.prototype.createdTab = function(evt) {
  var currentNode = this.getCurrentNode();
  var node;

  if (tabIdMap[evt.data.tabId]) {
    // This is a resumed node
    node = Node.cache.read(tabIdMap[evt.data.tabId]);
    node.tabId = evt.data.tabId;
    tabIdMap[evt.data.tabId] = node.id;
  } else {
    // This is a new node
    node = new Node({
      url: evt.data.url,
      title: evt.data.title,
      tabId: evt.data.tabId
    });

    if (currentNode && evt.data.url !== "chrome://newtab/" && !node.parentId
        && evt.data.url.indexOf(chrome.runtime.getURL("/")) < 0) {
      node.parentId = currentNode.id;

      if (currentNode.recording && currentNode.assignmentId) {
        node.recording    = currentNode.recording;
        node.assignmentId = currentNode.assignmentId;

        node.save().then(function(savedNode) {
          tabIdMap[evt.data.tabId] = savedNode.id;
        }.bind(this));
      }
    }

    // Map to the temporary ID, this will be overwritten if the node is saved
    tabIdMap[evt.data.tabId] = node.id;
  }

};

/**
 * Called when a tab updated event is processed by _flushBuffer.
 *
 * @function StateManager#updatedTab
 * @param {Object} evt - The event object emitted by `eventAdapter`
 * @private
 */
StateManager.prototype.updatedTab = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId]);
  var parentNode = (node && node.parentId) ? Node.cache.read(node.parentId) : undefined;

  if (node && evt.data.url && evt.data.url !== node.url) {
    if (node.url === "chrome://newtab/" || node.url === "") {
      // Opened a new tab
      node.url = evt.data.url;
      node.title = evt.data.title;
    } else if (parentNode && evt.data.url && evt.data.url === parentNode.url) {
      // Navigating back
      var node = Node.cache.read(node.id);
      delete node.tabId;
      parentNode.recording = node.recording;
      tabIdMap[evt.data.tabId] = parentNode.id;
    } else if (Node.findWhere({ parentId: node.id, url: evt.data.url })) {
      // Navigating to an existing child
      var node = Node.cache.read(node.id);
      delete node.tabId;
      var childNode = Node.findWhere({ parentId: node.id, url: evt.data.url });
      childNode.recording = node.recording;
      tabIdMap[evt.data.tabId] = childNode.id;
    } else {
      // Navigating to a new child
      var newNode = new Node({
        parentId:   node.id,
        tabId:      node.tabId,
        url:        evt.data.url,
        title:      evt.data.title
      });

      if (node.recording) {
        newNode.recording    = node.recording;
        newNode.assignmentId = node.assignmentId;
      };

      if (typeof node.id === "number" && newNode.recording && newNode.assignmentId) {
        newNode.save().then(function(savedNode) {
          tabIdMap[evt.data.tabId] = savedNode.id;
        }.bind(this));
      };

      // Map to the temporary ID, this will be overwritten if the node is saved
      tabIdMap[evt.data.tabId] = newNode.id;
      delete node.tabId;
    }
  } else if (node && evt.data.title) {
    node.title = evt.data.title;
  }
};

/**
 * Called when a tab switch event is processed by _flushBuffer.
 *
 * @function StateManager#switchedTab
 * @param {Object} evt - The event object emitted by `eventAdapter`
 * @private
 */
StateManager.prototype.switchedTab = function(evt) {
  extensionStates.currentTabId = evt.data.tabId;
};

/**
 * Called when a tab close event is processed by _flushBuffer.
 * Removes the node from the tabId->Node map, unsets its tab ID reference,
 * unsets its recording state
 *
 * @function StateManager#closedTab
 * @param {Object} evt - The event object emitted by `eventAdapter`
 * @private
 */
StateManager.prototype.closedTab = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId]);
  if (node) {
    delete node.recording;
    delete node.tabId;
    chrome.runtime.sendMessage({action: "updatedNodes", assignmentId: node.assignmentId})
  }
  delete tabIdMap[evt.data.tabId];
};

/**
 * Called when a Node is resumed, opening a new tab.
 * This event converges the old Node, and the Node created as a result of the
 * re-opening tab being handled by createdTab.
 *
 * @function StateManager#resumedNode
 * @param {Object} evt - The event object created in {@link
 * Statemanager#resumeRecording}
 * @private
 */
StateManager.prototype.resumedNode = function(evt) {
  // Get the node to be resumed
  var node = Node.cache.read(evt.data.nodeId);

  // If a node was created by the createdTab event, remove it
  if (tabIdMap[evt.data.tabId]) {
    var tmpNode = Node.cache.read(tabIdMap[evt.data.tabId]);
    tmpNode.destroy();
  }

  // Map the tab ID to the resumed node and set it to be recording
  tabIdMap[evt.data.tabId] = node.id;
  startRecording(evt.data.tabId, node.assignmentId);
};

StateManager.prototype.redirectPending = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId])
  //switch url with redirect url
  //TODO make sure title is correct
  node.url = evt.data.redirectUrl
  node.save().then(function(updatedNode) {
    //unused
    chrome.runtime.sendMessage({action: 'updatedNode', updatedNode: updatedNode})
  });
};


/**
 * Binds an event to a default handler that pushes the event into a buffer,
 * then calls a de-bounced function to flush the buffer.
 *
 * @function StateManager#_bindEvent
 * @param {string} name - The name of the event to be bound to the default
 * (buffered) handler
 * @private
 */
//DEPRECATED
StateManager.prototype._bindEvent = function(name) {
  this._eventAdapter[name].addListener( function(tabEvent) {
    this._eventBuffer.push(tabEvent);
    this._flushBuffer();
  }.bind(this));
};

module.exports = StateManager;
