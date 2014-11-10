var _           = require('lodash');
var Promise     = require('promise');

var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

var Fluxxor = require('fluxxor');

var Assignment = Fluxxor.createStore(properties) {
  var properties = properties || {};

  this.id             = properties.id || Assignment._getId();
  this.completedAt    = properties.completed_at || properties.completedAt;
  this.description    = properties.description;
  this.projectId      = properties.project_id || properties.projectId;
  this.startedAt      = properties.started_at || properties.startedAt;
  this.title          = properties.title || "Untitled " + this.id;
  this.userId         = properties.user_id || properties.userId;
  this.tempId         = properties.temp_id || properties.tempId || this.id;
  this.visible        = properties.visible || false;
  this.url            = properties.url;

  /** DEPRECATED - included only for compatibility with Browser */
  this.currentNodeId  = properties.current_node_id || properties.currentNodeId;

  Assignment._instances[this.id] = this;
};
Assignment.cache = {};

/**
 * Return the properties that can be persisted on the server
 * @returns {Object}
 */
Assignment.prototype.toProps = function() {
  var props = {};

  props.title           = this.title || "New Trail";
  props.description     = this.description || "Recording from " + new Date().toLocaleString();
  props.started_at      = this.startedAt;
  props.completed_at    = this.completedAt;
  props.visible         = this.visible;
  props.url             = this.url || null;

  /** DEPRECATED - included only for compatibility with Browser */
  props.current_node_id = this.currentNodeId;

  if (this.tempId) props.temp_id = this.tempId;

  return props;
};

// store the instances in memory
Assignment._instances = {};

/**
 * Returns a temporary ID to identify the Assignment uniquely in memory
 * @returns {string}
 * @private
 */
var S4 = function() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };

var uuid = function() {
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()); };

Assignment._getId = function() {
  return "TB_." + uuid();
};

/**
 * Return an Assignment, if it exists, corresponding to the given ID.
 * @param {number} id - The ID of the {@link Assignment}
 * @returns {Assignment}
 */
Assignment.cache.read = function(id) {
  return Assignment._instances[id];
};

/**
 * Return all Assignments in the cache
 * @param {number} id - The ID of the {@link Assignment}
 * @returns {Array<Assignment>}
 */
Assignment.cache.list = function() {
  return _.values(Assignment._instances);
};

/**
 * Request an Assignment from the storage adapter corresponding to the
 * provided ID
 * @param {number} id - The ID of the {@link Assignment}
 * @returns {Assignment}
 */
Assignment.read = function(id) {
  return new TrailblazerHTTPStorageAdapter().read("assignments", id);
};

/**
 * Request all Assignments from the storage adapter.
 * @returns {Promise} - Resolves with Array<Assignment> or an error object
 */
Assignment.list = function() {
  return new Promise(function(resolve, reject) {
    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter().list("assignments").then(
      function(response) {
        // Update our cache with the response (only for keys in the response -
        // we may have unsaved models)
        _.each(response.assignments, function(r) {
          Assignment._instances[r.id] = new Assignment(r);
        }.bind(this));

        // Resolve the promise with the assignments
        resolve(Assignment.cache.list());
      }.bind(this),

      // Reject the Promise with the adapter error
      reject);
  }.bind(this));
};

// TODO break out into create() and update() - simplifies the models greatly
// and will avoid potentially overwriting fields when calling save in quick
// succession (dirty attributes aren't tracked, so the whole model is sent in
// the request)
Assignment.prototype.save = function() {
  if (!this._saving) {
    this._saving = true;
    return new Promise(function(resolve, reject) {
      if (typeof this.id === "number") {
        // It's been saved before
        new TrailblazerHTTPStorageAdapter().update("assignments", this.id, { assignment: this.toProps() }, {})
          .then(function(response) {
            this.id = response.id;
            this.url = response.url;
            Assignment._instances[this.id] = this;
            resolve(this);
          }.bind(this), function(response) { reject(response); });

      } else if (this.id.indexOf("TB_.") >= 0) {
        // It's a temporary ID
        new TrailblazerHTTPStorageAdapter().create("assignments", { assignment: this.toProps() }, {})
          .then(function(response) {
            delete Assignment._instances[this.id];
            this.id = response.id;
            Assignment._instances[this.id] = this;
            resolve(this);
          }.bind(this), function(response) { reject(response); });
      }
      delete this._saving;
    }.bind(this));
  }
};

Assignment.prototype.destroy = function() {
  // Purge from the cache
  delete Assignment._instances[this.id];
  if (typeof this.id === "number") {
    // It's not a temp ID, so it should be persisted on the server
    return new TrailblazerHTTPStorageAdapter().destroy("assignments", this.id);
  } else {
    return new Promise(function(resolve, reject) { resolve(); });
  }
};

/**
 * Find a cached Assignment that matches the supplied properties
 * Delegates match to Underscore's findWhere function
 * @param {Object} props - The properties to match
 * @returns {Assignment}
 */
Assignment.cache.findWhere = function(props) {
  return _.findWhere(Assignment._instances, props);
};


module.exports = Assignment;
