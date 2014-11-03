var Node      = require('../model/node')
 ,  tabIdMap  = require('../core/tab-id-map');

module.exports = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId]);
  if (node) {
    delete node.recording;
    delete node.tabId;
    chrome.runtime.sendMessage({action: "updatedNodes", assignmentId: node.assignmentId})
  }
  delete tabIdMap[evt.data.tabId];
};