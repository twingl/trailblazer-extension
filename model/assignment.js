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
    properties = properties || {};

    this.id = properties.id || Assignment._getId();

    context.Assignment._instances[this.id] = this;
  };
  context.Assignment.cache = {};

  // store the instances in memory
  context.Assignment._instances = {};

  /**
   * Returns a temporary ID to identify the Assignment uniquely in memory
   * @returns {string}
   * @private
   */
  context.Assignment._getId = function() {
    Assignment.i = Assignment.i || 0;
    return ++Assignment.i; //TODO generate actual ID.
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
