var _       = require('lodash');
var Promise = require('promise');

var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

/**
 * @lends Node
 */
Node = function(properties) {
  var properties = properties || {};

  this.id           = properties.id || Node._getId();
  this.parentId     = properties.parent_id || properties.parentId;
  this.assignmentId = properties.assignment_id || properties.assignmentId;
  this.recording    = properties.recording;
  this.url          = properties.url;
  this.title        = properties.title;
  this.tabId        = properties.tabId;
  this.favIconUrl   = properties.favIconUrl;
  this.rank         = properties.rank || 0;

  this.tempId       = properties.temp_id || properties.tempId || this.id;

  Node._instances[this.id] = this;
};

Node.cache = {};

/**
 * Return the properties that can be persisted on the server
 * @returns {Object}
 */
Node.prototype.toProps = function() {
  var props = {};

  if (this.parentId) props.parent_id  = this.parentId;
  if (this.url)      props.url        = this.url;
  if (this.title)    props.title      = this.title;
  if (this.rank)     props.rank       = this.rank;

  if (this.tempId)   props.temp_id    = this.tempId;

  return props;
};

// store the instances in memory
Node._instances = {};

/**
 * Returns a temporary ID to identify the node uniquely in memory
 * @returns {string}
 * @private
 */
var S4 = function() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };

var uuid = function() {
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()); };

Node._getId = function() {
  return "TB_." + uuid();
};

/**
 * Return a Node, if it exists, corresponding to the given ID.
 * @param {number} id - The ID of the {@link Node}
 * @returns {Node}
 */
Node.cache.read = function(id) {
  return Node._instances[id];
};

/**
 * Return all Nodes in the cache
 * @param {number} id - The ID of the {@link Node}
 * @returns {Array<Node>}
 */
Node.cache.list = function(assignmentId) {
  var conditions = {};
  if (assignmentId) conditions.assignmentId = assignmentId;
  return _.where(Node._instances, conditions);
};

/**
 * Request a Node from the storage adapter, corresponding to the provided ID
 * @param {number} id - The ID of the {@link Node}
 * @returns {Node}
 */
Node.read = function(id) {
  return new TrailblazerHTTPStorageAdapter().read("nodes", id);
};

/**
 * Request all Nodes from the storage adapter.
 * @returns {Promise} - Resolves with Array<Node> or an error object
 */
Node.list = function(assignmentId) {
  return new Promise(function(resolve, reject) {
    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter().list(["assignments", assignmentId, "nodes"].join("/")).then(
      function(response) {
        // Update our cache with the response (only for keys in the response -
        // we may have unsaved models)
        _.each(response.nodes, function(r) {
          Node._instances[r.id] = new Node(r);
        }.bind(this));

        // Resolve the promise with the assignments
        resolve(Node.cache.list());
      }.bind(this),

      // Reject the Promise with the adapter error
      reject);
  }.bind(this));
};

// TODO break out into create() and update() - simplifies the models greatly
// and will avoid potentially overwriting fields when calling save in quick
// succession (dirty attributes aren't tracked, so the whole model is sent in
// the request)
Node.prototype.save = function() {
  var updateChildren = function(parentNode) {
    var children = Node.where({
      parentId: parentNode.tempId,
      assignmentId: parentNode.assignmentId
    });

    _.each(children, function(node) {
      node.parentId = parentNode.id;
      node.save();
    });
  };

  if (!this._saving) {
    this._saving = true;
    return new Promise(function(resolve, reject) {
      if (typeof this.id === "number") {
        // It's been saved before
        new TrailblazerHTTPStorageAdapter().update("nodes", this.id, { node: this.toProps() }, {}).then(function(response) {
          this.id = response.id;
          Node._instances[this.id] = this;
          updateChildren(this);
          resolve(this);
        }.bind(this), function(response) { reject(response); });

      } else if (this.id.indexOf("TB_.") >= 0) {
        // It's a temporary ID
        new TrailblazerHTTPStorageAdapter().create("nodes", { node: this.toProps() }, {
          parentResource: {
            name: "assignments",
            id: this.assignmentId
          }
        }).then(function(response) {
          delete Node._instances[this.id];
          this.id = response.id;
          Node._instances[this.tempId] = this;
          Node._instances[this.id] = this;
          updateChildren(this);
          resolve(this);
        }.bind(this), function(response) { reject(response); });
      }
      delete this._saving;
    }.bind(this));
  }
};

Node.prototype.destroy = function() {
  if (typeof this.id === "number") {
    // It's not a temp ID, so it should be persisted on the server
    new TrailblazerHTTPStorageAdapter().destroy("nodes", this.id);
  }
  // Purge from the cache
  delete Node._instances[this.id];
};

/**
 * Find a Node that matches the supplied properties
 * Delegates match to Underscore's findWhere function
 * @param {Object} props - The properties to match
 * @returns {Node}
 */
Node.findWhere = function(props) {
  return _.findWhere(Node._instances, props);
};

/**
 * Return nodes that match the supplied properties
 * Delegates match to Underscore's where function
 * @param {Object} props - The properties to match
 * @returns {Node}
 */
Node.where = function(props) {
  return _.where(Node._instances, props);
};

module.exports = Node;
