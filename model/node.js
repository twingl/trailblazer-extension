/**
 * Creates a new node
 * @name Node
 *
 * @class
 * @classdesc
 * Model encapsulating a node in an assignment's history.
 *
 * @property {number/string} id - Unique identifier of the Node.
 * Temporary IDs are strings of the form TB._<random identifier>
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
    this.parentId     = properties.parentId;
    this.assignmentId = properties.assignmentId;
    this.recording    = properties.recording;
    this.url          = properties.url;
    this.title        = properties.title;

    context.Node._instances[this.id] = this;
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
    return ++Node.i; //TODO generate actual ID.
  };

  /**
   * Return a Node, if it exists, corresponding to the given ID.
   * @param {number} id - The ID of the {@link Node}
   * @returns {Node}
   */
  context.Node.read = function(id) {
    return context.Node._instances[id];
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
