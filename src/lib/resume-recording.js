var stateManager = require('../core/state-manager');


module.exports = function(tabId, nodeId) {
  var tabEvent = {
    type: "resumed_node",
    occurred: Date.now(),
    data: {
      tabId: tabId,
      nodeId: nodeId
    }
  };
  stateManager._eventBuffer.push(tabEvent);
  stateManager._flushBuffer();
};