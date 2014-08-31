/**
 * Creates a new node
 * @name Node
 *
 * @class
 * @classdesc
 * Model encapsulating a node in a history tree. Must belong to a {@link Tree}
 *
 * @property {number/string} id - Unique identifier of the Node.
 * Temporary IDs are strings of the form TB._<random identifier>
 * @property {number} parentId
 * @property {number} treeId
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

    this.id       = properties.id || Node._getId();
    this.parentId = properties.parentId;
    this.treeId   = properties.treeId;
    this.url      = properties.url;
    this.title    = properties.title;
  };

  /**
   * Returns a temporary ID to identify the node uniquely in memory
   * @returns {string}
   * @private
   */
  context.Node._getId = function() {
    Node.i = Node.i || 0;
    return ++Node.i; //TODO generate actual ID.
  };
  
}(window));
