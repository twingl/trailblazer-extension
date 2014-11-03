var tabIdMap = require('../core/tab-id-map')
 ,  Node     = require('../model/node'); 


module.exports = function(evt) {
  var node = Node.cache.read(tabIdMap[evt.data.tabId])
  //switch url with redirect url
  //TODO make sure title is correct
  node.url = evt.data.redirectUrl
  node.save().then(function(updatedNode) {
    //unused
    chrome.runtime.sendMessage({action: 'updatedNode', updatedNode: updatedNode})
  });
};