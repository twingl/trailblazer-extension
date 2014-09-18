/**
 * Creates a new node
 * @name Node
 *
 * @class
 * @classdesc
 * Model encapsulating a node in an assignment's history.
 *
 * @property {number/string} id - Unique identifier of the Node.
 * Temporary IDs are strings of the form TB._<identifier>
 * @property {number} parentId
 * @property {string} url
 * @property {string} title
 */
(function (context) {
  'use strict';

  /**
   * @lends Node
   */
  context.Node = function(properties) {
    properties = properties || {};

    this.id           = properties.id || Node._getId();
    this.parentId     = properties.parent_id || properties.parentId;
    this.assignmentId = properties.assignment_id || properties.assignmentId;
    this.recording    = properties.recording;
    this.url          = properties.url;
    this.title        = properties.title;
    this.tabId        = properties.tabId;

    context.Node._instances[this.id] = this;
  };
  context.Node.cache = {};

  /**
   * Return the properties that can be persisted on the server
   * @returns {Object}
   */
  context.Node.prototype.toProps = function() {
    var props = {};

    if (this.parentId) props.parent_id = this.parentId;
    if (this.url)      props.url = this.url;
    if (this.title)    props.title = this.title;

    return props;
  };

  // store the instances in memory
  context.Node._instances = {};

  /**
   * Returns a temporary ID to identify the node uniquely in memory
   * @returns {string}
   * @private
   */
  context.Node._getId = function() {
    Node.i = Node.i || 0;
    return "TB_." + ++Node.i;
  };

  /**
   * Return a Node, if it exists, corresponding to the given ID.
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Node}
   * @returns {Node}
   */
  context.Node.cache.read = function(adapter, id) {
    return context.Node._instances[id];
  };

  /**
   * Return all Nodes in the cache
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Node}
   * @returns {Array<Node>}
   */
  context.Node.cache.list = function(adapter, assignmentId) {
    var conditions = {};
    if (assignmentId) conditions.assignmentId = assignmentId;
    return _.where(context.Node._instances, conditions);
  };

  /**
   * Request a Node from the storage adapter, corresponding to the provided ID
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Node}
   * @returns {Node}
   */
  context.Node.read = function(adapter, id) {
    return adapter.read("nodes", id);
  };

  /**
   * Request all Nodes from the storage adapter.
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @returns {Promise} - Resolves with Array<Node> or an error object
   */
  context.Node.list = function(adapter, assignmentId) {
    return new Promise(function(resolve, reject) {
      // Request assignments from the storage adapter
      adapter.list(["assignments", assignmentId, "nodes"].join("/")).then(
        function(response) {
          // Update our cache with the response (only for keys in the response -
          // we may have unsaved models)
          _.each(response.nodes, function(r) {
            context.Node._instances[r.id] = new context.Node(r);
          }.bind(this));

          // Resolve the promise with the assignments
          resolve(context.Node.cache.list(adapter));
        }.bind(this),

        // Reject the Promise with the adapter error
        reject);
    }.bind(this));
  };

  context.Node.prototype.save = function(adapter) {
    if (!this._saving) {
      this._saving = true;
      return new Promise(function(resolve, reject) {
        if (typeof this.id === "number") {
          // It's been saved before
          adapter.update("nodes", this.id, { node: this.toProps() }, {}).then(function(response) {
            this.id = response.id;
            context.Node._instances[this.id] = this;
            resolve(this);
          }.bind(this), function(response) { reject(response); });

        } else if (this.id.indexOf("TB_.") >= 0) {
          // It's a temporary ID
          adapter.create("nodes", { node: this.toProps() }, {
            parentResource: {
              name: "assignments",
              id: this.assignmentId
            }
          }).then(function(response) {
            this.id = response.id;
            context.Node._instances[this.id] = this;
            resolve(this);
          }.bind(this), function(response) { reject(response); });
        }
        delete this._saving;
      }.bind(this));
    }
  };

  context.Node.prototype.destroy = function(adapter) {
    if (typeof this.id === "number") {
      // It's not a temp ID, so it should be persisted on the server
      adapter.destroy("nodes", this.id);
    }
    // Purge from the cache
    delete context.Node._instances[this.id];
  };

  /**
   * Find a Node that matches the supplied properties
   * Delegates match to Underscore's findWhere function
   * @param {Object} props - The properties to match
   * @returns {Node}
   */
  context.Node.findWhere = function(props) {
    return _.findWhere(context.Node._instances, props);
  };

}(window));
