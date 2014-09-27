(function (context) {
  'use strict';

  /**
   * @const {number} StateManager.DEBOUNCE_MS - The length of time to de-bounce {@link
   * _flushBuffer} in milliseconds
   * @private
   */
  var DEBOUNCE_MS = 700;

  /**
   * @typedef StateManager.Config
   *
   * @property {EventAdapter} eventAdapter - An event adapter **class** to use for
   * receiving events. Currently this only supports Google Chrome through
   * {@link ChromeEventAdapter}
   *
   * @property {IdentityAdapter} identityAdapter - An identity adapter **class**
   * to use for authenticating with Trailblazer. Currently only supports Google
   * Chrome through {@link ChromeIdentityAdapter}
   *
   * @property {Object} api
   * @property {string} api.host - The API host
   * @property {string} api.namespace - URL fragment under which the API is
   * namespaced (if any, often "api")
   * @property {string} api.version - The API version
   * @property {string} api.clientId - Client ID used to identify with the API
   */

  /**
   * Creates a new StateManager
   *
   * @class StateManager
   * @classdesc
   * Receives events through an instance of {@link ChromeEventAdapter} and
   * manages the recording state associated with each tab.
   * When a tab is recording, it uses events received to build the data
   * structures necessary to represent a browsing trail.
   *
   * This class should not have any browser-specific code in it—that is
   * restricted to concrete adapter implementations such as {@link
   * ChromeEventAdapter}.
   *
   * @param {StateManager.Config} config - {@link StateManger} configuration
   *
   * @property {Map<number, Node>} nodes - Nodes that have been visited during this
   * session
   */
  context.StateManager = function(config) {

    /**
     * @property {StateManager.Config} _config
     */
    this._config = config;

    /**
     * @property {Map<number, number>} _tabIdMap - Map of Tab IDs to Node IDs.
     * @TODO: Declare whether tab IDs need to be in existence to be included in
     * this map
     * @private
     */
    this._tabIdMap = {};

    /**
     * @property {number} _currentTabId - Tab ID of the tab that is currently
     * focused
     * @private
     */
    this._currentTabId = undefined;

    /**
     * @property {EventAdapter} _eventAdapter - The instance of the
     * EventAdapter being used to receive events
     * @private
     */
    this._eventAdapter = new this._config.eventAdapter(this);

    /**
     * @property {IdentityAdapter} _identityAdapter - The instance of the
     * IdentityAdapter being used for authentication
     * @private
     */
    this._identityAdapter = new this._config.identityAdapter(this);

    /**
     * @property {StorageAdapter} _storageAdapter - The instance of the
     * StorageAdapter being used for communicating with resource stores
     */
    this._storageAdapter = new this._config.storageAdapter(this);

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

    // Indicate to the EventAdapter that we're ready to start listening for
    // events. Pass in `true` so that we get the initial browser state.
    this._eventAdapter.ready(true);
  };

  /**
   * Accessor function to get a reference to the config object
   * @function StateManager#getConfig
   */
  context.StateManager.prototype.getConfig = function() {
    return this._config;
  };

  /**
   * Return the collection of nodes associated with an assignment, or all nodes
   * if no ID is supplied.
   *
   * Object returned contains a key 'nodes' which references a Map<id, Node>
   *
   * @param {number} assignmentId - The Assignment ID to scope the nodes to
   * @returns {Object}
   */
  context.StateManager.prototype.getMap = function(assignmentId, callback) {
    var data = {
      nodes: {},
      assignment: Assignment.cache.read(this._storageAdapter, assignmentId),
    };

    // Make a copy of the node store
    var tmp = {};
    _.extend(tmp, Node.cache.list(this._storageAdapter, assignmentId));

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
      _.each(this._tabIdMap, function(map, key) {
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
  context.StateManager.prototype.assignments = function(cb) {
    Assignment.list(this._storageAdapter).then(function(assignments) {
      cb(assignments);
    });
    return Assignment.cache.list(this._storageAdapter);
  };


  /**
   * Accessor function to get a cached copy of the nodes (if any), and
   * pass an updated copy of the list to an optional callback function
   * @function StateManager#nodes
   * @param {function} callback - Will be called with an updated list of
   * nodes from the server
   */
  context.StateManager.prototype.nodes = function(assignmentId, cb) {
    Node.list(this._storageAdapter, assignmentId).then(function(nodes) {
      cb(nodes);
    });
    return Node.cache.list(this._storageAdapter, assignmentId);
  };

  /**
   * Proxy function to the IdentityAdapter's signIn
   * @function StateManager#signIn
   */
  context.StateManager.prototype.signIn = function() {
    return this._identityAdapter.signIn();
  };

  /**
   * Proxy function to the IdentityAdapter's signOut
   * @function StateManager#signOut
   */
  context.StateManager.prototype.signOut = function() {
    return this._identityAdapter.signOut();
  };

  /**
   * Proxy function to the IdentityAdapter's isSignedIn
   * @function StateManager#isSignedIn
   */
  context.StateManager.prototype.isSignedIn = function() {
    return this._identityAdapter.isSignedIn();
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
  context.StateManager.prototype.startRecording = function(tabId, assignmentId) {
    if (!this.getNode(tabId).recording) {
      var assignment;
      if (assignmentId) {
        // It's an existing assignment
        assignment = Assignment.cache.read(this._storageAdapter, assignmentId);
      } else {
        // We need to create a new assignment
        assignment = new Assignment();
      }

      assignment.currentNodeId = this.getNode(tabId).id;

      // Ensure we have a valid ID for the assignment so we can start saving
      // the trail
      assignment.save(this._storageAdapter).then(function(assignment) {
        this.getNode(tabId).assignmentId = assignment.id;
        this.getNode(tabId).recording = true;
        this.getNode(tabId).save(this._storageAdapter);
        // TODO Feature? Iterate over the existing, in-memory nodes and save the
        // connected graph - this will save the entire tree, if desirable.
        // Pending team discussion
      }.bind(this));
    }
  };

  /**
   * Stop recording a Tab's activity.
   *
   * @function StateManager#stopRecording
   * @param {number} tabId - the ID of the Tab to stop monitoring
   */
  context.StateManager.prototype.stopRecording = function(tabId) {
    this.getNode(tabId).recording = false;
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
  context.StateManager.prototype.resumeRecording = function(tabId, nodeId) {
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
  context.StateManager.prototype.getTabInfo = function(tabId) {};

  /**
   * Returns a Node corresponding to the given Tab ID, creating one if it does
   * not exist.
   *
   * @TODO factor out into Node.find(OrCreate)ByTabId();
   *
   * @function StateManager#getNode
   * @param {number} tabId - The tabId whose Node should be retrieved
   * @returns {Node}
   */
  context.StateManager.prototype.getNode = function(tabId) {
    var node = undefined,
        nodeId = this._tabIdMap[tabId];

    if (nodeId) {
      // Return the existing Node
      node = Node.cache.read(this._storageAdapter, nodeId);
    } else {
      // Create and map the Tab ID to a new Node
      node = new Node();
      this._tabIdMap[tabId] = node.id;
    }

    return node;
  };

  /**
   * Returns the Node corresponding to the currently focused tab.
   *
   * @function StateManager#getCurrentNode
   * @returns {Node} Returns the node if found, otherwise `null`
   */
  context.StateManager.prototype.getCurrentNode = function() {
    var nodeId = this._tabIdMap[this._currentTabId];

    if (nodeId) {
      return context.Node.cache.read(this._storageAdapter, nodeId);
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
  context.StateManager.prototype._flushBuffer = _.debounce( function() {
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
  context.StateManager.prototype.createdTab = function(evt) {
    var currentNode = this.getCurrentNode();
    var node;

    if (this._tabIdMap[evt.data.tabId]) {
      // This is a resumed node
      node = Node.cache.read(this._storageAdapter, this._tabIdMap[evt.data.tabId]);
      node.tabId = evt.data.tabId;
      this._tabIdMap[evt.data.tabId] = node.id;
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

          node.save(this._storageAdapter).then(function(savedNode) {
            this._tabIdMap[evt.data.tabId] = savedNode.id;
          }.bind(this));
        }
      }

      // Map to the temporary ID, this will be overwritten if the node is saved
      this._tabIdMap[evt.data.tabId] = node.id;
    }

  };

  /**
   * Called when a tab updated event is processed by _flushBuffer.
   *
   * @function StateManager#updatedTab
   * @param {Object} evt - The event object emitted by `eventAdapter`
   * @private
   */
  context.StateManager.prototype.updatedTab = function(evt) {
    var node = Node.cache.read(this._storageAdapter, this._tabIdMap[evt.data.tabId]);
    var parentNode = (node && node.parentId) ? Node.cache.read(this._storageAdapter, node.parentId) : undefined;
    
    if (node && evt.data.url && evt.data.url !== node.url) {
      if (node.url === "chrome://newtab/" || node.url === "") {
        // Opened a new tab
        node.url = evt.data.url;
        node.title = evt.data.title;
      } else if (parentNode && evt.data.url && evt.data.url === parentNode.url) {
        // Navigating back
        var node = Node.cache.read(this._storageAdapter, node.id);
        delete node.tabId;
        this._tabIdMap[evt.data.tabId] = parentNode.id;
      } else if (Node.findWhere({ parentId: node.id, url: evt.data.url })) {
        // Navigating to an existing child
        var node = Node.cache.read(this._storageAdapter, node.id);
        delete node.tabId;
        this._tabIdMap[evt.data.tabId] = Node.findWhere({ parentId: node.id, url: evt.data.url }).id;
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
          newNode.save(this._storageAdapter).then(function(savedNode) {
            this._tabIdMap[evt.data.tabId] = savedNode.id;
          }.bind(this));
        };

        // Map to the temporary ID, this will be overwritten if the node is saved
        this._tabIdMap[evt.data.tabId] = newNode.id;
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
  context.StateManager.prototype.switchedTab = function(evt) {
    this._currentTabId = evt.data.tabId;
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
  context.StateManager.prototype.closedTab = function(evt) {
    var node = Node.cache.read(this._storageAdapter, this._tabIdMap[evt.data.tabId]);
    if (node) {
      delete node.recording;
      delete node.tabId;
    }
    delete this._tabIdMap[evt.data.tabId];
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
  context.StateManager.prototype.resumedNode = function(evt) {
    // Get the node to be resumed
    var node = Node.cache.read(this._storageAdapter, evt.data.nodeId);

    // If a node was created by the createdTab event, remove it
    if (this._tabIdMap[evt.data.tabId]) {
      var tmpNode = Node.cache.read(this._storageAdapter, this._tabIdMap[evt.data.tabId]);
      tmpNode.destroy();
    }

    // Map the tab ID to the resumed node and set it to be recording
    this._tabIdMap[evt.data.tabId] = node.id;
    this.startRecording(evt.data.tabId, node.assignmentId);
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
  context.StateManager.prototype._bindEvent = function(name) {
    this._eventAdapter[name].addListener( function(tabEvent) {
      this._eventBuffer.push(tabEvent);
      this._flushBuffer();
    }.bind(this));
  };

}(window));
