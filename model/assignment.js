/**
 * Creates a new assignment
 *
 * @class Assignment
 * @classdesc
 * Model encapsulating the entire history (multiple Trees) of an Assignment's
 * browsing history.
 *
 * @property {number} id
 * @property {number} assignmentId
 */
(function (context) {
  'use strict';

  context.Assignment = function(properties) {
    var properties = properties || {};

    this.id             = properties.id || Assignment._getId();
    this.completedAt    = properties.completed_at || properties.completedAt;
    this.currentNodeId  = properties.current_node_id || properties.currentNodeId;
    this.description    = properties.description;
    this.projectId      = properties.project_id || properties.projectId;
    this.startedAt      = properties.started_at || properties.startedAt;
    this.title          = properties.title || "Untitled " + this.id;
    this.userId         = properties.user_id || properties.userId;

    context.Assignment._instances[this.id] = this;
  };
  context.Assignment.cache = {};

  /**
   * Return the properties that can be persisted on the server
   * @returns {Object}
   */
  context.Assignment.prototype.toProps = function() {
    var props = {};

    props.title           = this.title || "New Trail";
    props.description     = this.description || "Recording from " + new Date().toLocaleString();
    props.started_at      = this.startedAt;
    props.completed_at    = this.completedAt;
    props.current_node_id = this.currentNodeId;

    return props;
  };

  // store the instances in memory
  context.Assignment._instances = {};

  /**
   * Returns a temporary ID to identify the Assignment uniquely in memory
   * @returns {string}
   * @private
   */
  context.Assignment._getId = function() {
    Assignment.i = Assignment.i || 0;
    return "TB_." + ++Assignment.i;
  };

  /**
   * Return an Assignment, if it exists, corresponding to the given ID.
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Assignment}
   * @returns {Assignment}
   */
  context.Assignment.cache.read = function(adapter, id) {
    return context.Assignment._instances[id];
  };

  /**
   * Return all Assignments in the cache
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Assignment}
   * @returns {Array<Assignment>}
   */
  context.Assignment.cache.list = function(adapter) {
    return _.values(context.Assignment._instances);
  };

  /**
   * Request an Assignment from the storage adapter corresponding to the
   * provided ID
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @param {number} id - The ID of the {@link Assignment}
   * @returns {Assignment}
   */
  context.Assignment.read = function(adapter, id) {
    return adapter.read("assignments", id);
  };

  /**
   * Request all Assignments from the storage adapter.
   * @param {StorageAdapter} adapter - The storage adapter to query
   * @returns {Promise} - Resolves with Array<Assignment> or an error object
   */
  context.Assignment.list = function(adapter) {
    return new Promise(function(resolve, reject) {
      // Request assignments from the storage adapter
      adapter.list("assignments").then(
        function(response) {
          // Update our cache with the response (only for keys in the response -
          // we may have unsaved models)
          _.each(response.assignments, function(r) {
            context.Assignment._instances[r.id] = new context.Assignment(r);
          }.bind(this));

          // Resolve the promise with the assignments
          resolve(context.Assignment.cache.list(adapter));
        }.bind(this),

        // Reject the Promise with the adapter error
        reject);
    }.bind(this));
  };

  context.Assignment.prototype.save = function(adapter) {
    if (!this._saving) {
      this._saving = true;
      return new Promise(function(resolve, reject) {
        if (typeof this.id === "number") {
          // It's been saved before
          adapter.update("assignments", this.id, { assignment: this.toProps() }, {})
            .then(function(response) {
              this.id = response.id;
              context.Assignment._instances[this.id] = this;
              resolve(this);
            }.bind(this), function(response) { reject(response); });

        } else if (this.id.indexOf("TB_.") >= 0) {
          // It's a temporary ID
          adapter.create("assignments", { assignment: this.toProps() }, {})
            .then(function(response) {
              delete context.Assignment._instances[this.id];
              this.id = response.id;
              context.Assignment._instances[this.id] = this;
              resolve(this);
            }.bind(this), function(response) { reject(response); });
        }
        delete this._saving;
      }.bind(this));
    }
  };

  context.Assignment.prototype.destroy = function(adapter) {
    // Purge from the cache
    delete context.Assignment._instances[this.id];
    if (typeof this.id === "number") {
      // It's not a temp ID, so it should be persisted on the server
      return adapter.destroy("assignments", this.id);
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
  context.Assignment.cache.findWhere = function(props) {
    return _.findWhere(context.Assignment._instances, props);
  };

}(window));
