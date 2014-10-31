var Node      = require('../model/node')
 ,  tabIdMap  = require('../core/tab-id-map');

/**
 * Returns a Node corresponding to the given Tab ID, creating one if it does
 * not exist.
 *
 * @TODO factor out into Node.find(OrCreate)ByTabId();
 *
 * @function StateManager#getNode
 * @param {number} tabId - The tabId whose Node should be retrieved
 * @returns {Node}
 */
module.exports = function(tabId) {
  var node,
      nodeId = tabIdMap[tabId];

  if (nodeId) {
    // Return the existing Node
    node = Node.cache.read(nodeId);
  } else {
    // Create and map the Tab ID to a new Node
    node = new Node();
    tabIdMap[tabId] = node.id;
  }

  return node;
};