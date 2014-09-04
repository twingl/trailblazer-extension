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
   * @property {Map<number, Tree>} trees - Trees that are or have been referenced by
   * nodes in this session.
   *
   * @property {Map<number, Node>} nodes - Nodes that have been visited during this
   * session
   */
  context.StateManager = function(config) {

    // Initialize the tree/node maps
    // TODO factor out into Node/Tree respectively. Keep an instance of these
    // storage adapters on the StateManager, rather than managing the model
    // directly.
    this.trees = {};
    this.nodes = {};

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
     * from the event adapter. Periodically cleared and processed into the tree
     * data.
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
   * Accessor function to get a cached copy of the assignments (if any), and
   * pass an updated copy of the list to an optional callback function
   * @function StateManager#assignments
   * @param {function} callback - Will be called with an updated list of
   * assignments from the server
   */
  context.StateManager.prototype.assignments = function(cb) {
    this._assignments = this._assignments || [];
    this._storageAdapter.list("assignments").then(function(response) {
      this._assignments = response.assignments;
      console.log(response.assignments);
      cb(this._assignments);
    }.bind(this));
    return this._assignments;
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
   * @TODO Start recording the activity of a Tab.
   *
   * This method is intended to start recording on Tabs "manually" - that is,
   * not a child of a recorded tab.
   *
   * @function StateManager#startRecording
   * @param {number} tabId - the ID of the Tab to stop monitoring
   * @param {number} projectId - the ID of the Project to record to
   */
  context.StateManager.prototype.startRecording = function(tabId, projectId) {};

  /**
   * @TODO Stop recording a Tab's activity.
   *
   * @function StateManager#stopRecording
   * @param {number} tabId - the ID of the Tab to stop monitoring
   */
  context.StateManager.prototype.stopRecording = function(tabId) {};

  /**
   * @TODO Use the specified Tab to navigate to a Node within the Project's history
   *
   * @function StateManager#navigateTo
   * @param {number} tabId - The ID of the Tab to use
   * @param {number} nodeId - The ID of the Node to navigate to
   */
  context.StateManager.prototype.navigateTo = function(tabId, nodeId) {};

  /**
   * @TODO Get info about the specified tab, including its recording state, which
   * Node it corresponds to and which Project it belongs to (if applicable).
   *
   * ```javascript
   * {
   *   recording: true,
   *   projectId: 4,
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
      node = this.nodes[nodeId];
    } else {
      // Create and map the Tab ID to a new Node
      node = new Node();
      this.nodes[node.id] = node;
      this._tabIdMap[tabId] = { nodeId: node.id }
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
    return (this._tabIdMap[this._currentTabId]) ? this.getNode(this._currentTabId) : null;
  };

  /**
   * Flushes the StateManager's event buffer and processes it, inserting items
   * into the tree data where appropriate.
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
    this._eventBuffer = [];

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
      }
    }.bind(this));

  }, DEBOUNCE_MS );

  /**
   * Called when a tab creation event is processed by _flushBuffer.
   *
   * @function StateManager#createdTab
   * @param {Object} evt - The event object emitted by `eventAdapter`
   * @private
   */
  context.StateManager.prototype.createdTab = function(evt) {
    var currentNode = this.getCurrentNode();
    var node = new Node({
      url: evt.data.url,
      title: evt.data.title,
      tabId: evt.data.tabId
    });

    if (currentNode && evt.data.url !== "chrome://newtab/") {
      node.parentId = currentNode.id;
      var tree = this.trees[currentNode.treeId] || new Tree();
      this.trees[currentNode.treeId] = tree;
      node.treeId = tree.id;
    } else {
      var tree = new Tree();
      this.trees[tree.id] = tree;
      node.treeId = tree.id;
    }

    this._tabIdMap[evt.data.tabId] = node.id;
    this.nodes[node.id] = node;
  };

  /**
   * Called when a tab updated event is processed by _flushBuffer.
   *
   * @function StateManager#updatedTab
   * @param {Object} evt - The event object emitted by `eventAdapter`
   * @private
   */
  context.StateManager.prototype.updatedTab = function(evt) {
    var node = this.getNode(evt.data.tabId);
    var parentNode = (node.parentId) ? this.nodes[node.parentId] : undefined;

    if (evt.data.url !== node.url) {
      if (node.url === "chrome://newtab/" || node.url === "") {
        node.url = evt.data.url;
        node.title = evt.data.title;
      } else if (parentNode && evt.data.url && evt.data.url === parentNode.url) {
        this._tabIdMap[evt.data.tabId] = parentNode.id;
      } else if (_.findWhere(this.nodes, { parentId: node.id, url: evt.data.url })) {
        this._tabIdMap[evt.data.tabId] = _.findWhere(this.nodes, { parentId: node.id, url: evt.data.url }).id;
      } else {
        var newNode = new Node({
          parentId: node.id,
          treeId:   node.treeId,
          url:      evt.url,
          title:    evt.title
        });

        this._tabIdMap[evt.data.tabId] = newNode.id;
        this.nodes[newNode.id] = newNode;
      }
    } else {
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
   * Removes the node from the tabId->Node map
   *
   * @function StateManager#closedTab
   * @param {Object} evt - The event object emitted by `eventAdapter`
   * @private
   */
  context.StateManager.prototype.closedTab = function(evt) {
    delete this._tabIdMap[evt.data.tabId];
  };

  /**
   * Binds an event to a default handler that pushes the event into a buffer,
   * then calls a de-bounced function to flush the buffer into the tree data.
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
