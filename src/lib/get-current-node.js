var tabIdMap        = require('../core/tab-id-map')
  , Node            = require('../model/node')
  , extensionStates = require('../core/extension-states');

module.exports = function() {
  var nodeId = tabIdMap[extensionStates.currentTabId];

  if (nodeId) {
    return Node.cache.read(nodeId);
  } else {
    return null;
  }
};