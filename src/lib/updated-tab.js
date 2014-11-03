var Node      = require('../model/node')
 ,  tabIdMap  = require('../core/tab-id-map');



module.exports = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId]);
  var parentNode = (node && node.parentId) ? Node.cache.read(node.parentId) : undefined;

  if (node && evt.data.url && evt.data.url !== node.url) {
    if (node.url === "chrome://newtab/" || node.url === "") {
      // Opened a new tab
      node.url = evt.data.url;
      node.title = evt.data.title;
    } else if (parentNode && evt.data.url && evt.data.url === parentNode.url) {
      // Navigating back
      var node = Node.cache.read(node.id);
      delete node.tabId;
      parentNode.recording = node.recording;
      tabIdMap[evt.data.tabId] = parentNode.id;
    } else if (Node.findWhere({ parentId: node.id, url: evt.data.url })) {
      // Navigating to an existing child
      var node = Node.cache.read(node.id);
      delete node.tabId;
      var childNode = Node.findWhere({ parentId: node.id, url: evt.data.url });
      childNode.recording = node.recording;
      tabIdMap[evt.data.tabId] = childNode.id;
    } else {
      // Navigating to a new child
      var newNode = new Node({
        parentId:   node.id,
        tabId:      node.tabId,
        url:        evt.data.url,
        title:      evt.data.title
      });

      if (node.recording) {
        newNode.recording    = node.recording;
        newNode.assignmentId = node.assignmentId;
      };

      if (typeof node.id === "number" && newNode.recording && newNode.assignmentId) {
        newNode.save().then(function(savedNode) {
          tabIdMap[evt.data.tabId] = savedNode.id;
        }.bind(this));
      };

      // Map to the temporary ID, this will be overwritten if the node is saved
      tabIdMap[evt.data.tabId] = newNode.id;
      delete node.tabId;
    }
  } else if (node && evt.data.title) {
    node.title = evt.data.title;
  }
};