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
   * Return a Assignment, if it exists, corresponding to the given ID.
   * @param {number} id - The ID of the {@link Assignment}
   * @returns {Assignment}
   */
  context.Assignment.read = function(id) {
    return context.Assignment._instances[id];
  };

  /**
   * Find a Assignment that matches the supplied properties
   * Delegates match to Underscore's findWhere function
   * @param {Object} props - The properties to match
   * @returns {Assignment}
   */
  context.Assignment.findWhere = function(props) {
    return _.findWhere(context.Assignment._instances, props);
  };

}(window));
