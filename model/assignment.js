/**
 * Creates a new assignment
 *
 * @class Assignment
 * @classdesc
 * Model encapsulating the entire history (multiple Trees) of an Assignment's
 * browsing history. Is referenced by one or more {@link Tree}s
 *
 * @property {number} id
 * @property {number} assignmentId
 */
(function (context) {
  'use strict';

  context.Assignment = function(properties) {
    properties = properties || {};

    this.id = properties.id || Assignment._getId();
  };

  /**
   * Returns a temporary ID to identify the Assignment uniquely in memory
   * @returns {string}
   * @private
   */
  context.Assignment._getId = function() {
    Assignment.i = Assignment.i || 0;
    return ++Assignment.i; //TODO generate actual ID.
  };

}(window));
