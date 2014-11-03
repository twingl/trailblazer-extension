/**
 * Called when a tab creation event is processed by _flushBuffer.
 *
 * Inserts a new Node into the graph, connected to the currentNode under the
 * right conditions.
 *
 * If a node is being resumed, it will ensure the node is mapped to the tab
 *
 * @function StateManager#createdTab
 * @param {Object} evt - The event object emitted by `eventAdapter`
 * @private
 */


module.exports = function(evt) {
  var currentNode = this.getCurrentNode();
  var node;

  if (tabIdMap[evt.data.tabId]) {
    // This is a resumed node
    node = Node.cache.read(tabIdMap[evt.data.tabId]);
    node.tabId = evt.data.tabId;
    tabIdMap[evt.data.tabId] = node.id;
  } else {
    // This is a new node
    node = new Node({
      url: evt.data.url,
      title: evt.data.title,
      tabId: evt.data.tabId
    });

    if (currentNode && evt.data.url !== "chrome://newtab/" && !node.parentId
        && evt.data.url.indexOf(chrome.runtime.getURL("/")) < 0) {
      node.parentId = currentNode.id;

      if (currentNode.recording && currentNode.assignmentId) {
        node.recording    = currentNode.recording;
        node.assignmentId = currentNode.assignmentId;

        node.save().then(function(savedNode) {
          tabIdMap[evt.data.tabId] = savedNode.id;
        }.bind(this));
      }
    }

    // Map to the temporary ID, this will be overwritten if the node is saved
    tabIdMap[evt.data.tabId] = node.id;
  }

};