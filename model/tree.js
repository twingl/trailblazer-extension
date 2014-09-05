/**
 * Creates a new tree
 * @name Tree
 *
 * @class
 * @classdesc
 * Model encapsulating part of the history of a browsing session.
 * Is referenced by one or more {@link Node}s
 *
 * @property {number} id
 * @property {number} assignmentId
 */
(function (context) {
  'use strict';

  /**
   * @lends Tree
   */
  context.Tree = function(properties) {
    properties = properties || {};

    this.id           = properties.id || Tree._getId();
    this.assignmentId = properties.assignmentId || new Assignment().id;

    context.Tree._instances[this.id] = this;
  };

  // store the instances in memory
  context.Tree._instances = {};

  /**
   * Returns a temporary ID to identify the tree uniquely in memory
   * @returns {string}
   * @private
   */
  context.Tree._getId = function() {
    Tree.i = Tree.i || 0;
    return ++Tree.i; //TODO generate actual ID.
  };

}(window));
