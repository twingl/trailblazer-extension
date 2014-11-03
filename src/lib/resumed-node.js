var Node            = require('../model/node')
 ,  tabIdMap        = require('../core/tab-id-map')
 ,  startRecording  = require('./start-recording');

module.exports = function(evt) {
  // Get the node to be resumed
  var node = Node.cache.read(evt.data.nodeId);

  // If a node was created by the createdTab event, remove it
  if (tabIdMap[evt.data.tabId]) {
    var tmpNode = Node.cache.read(tabIdMap[evt.data.tabId]);
    tmpNode.destroy();
  }

  // Map the tab ID to the resumed node and set it to be recording
  tabIdMap[evt.data.tabId] = node.id;
  startRecording(evt.data.tabId, node.assignmentId);
};