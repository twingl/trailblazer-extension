//helper
var _           = require('lodash');

//models
var Assignment  = require('../model/assignment')
 ,  Node        = require('../model/node')
 ,  tabIdMap    = require('../core/tab-id-map'); 

/**
 * Return the collection of nodes associated with an assignment, or all nodes
 * if no ID is supplied.
 *
 * Object returned contains a key 'nodes' which references a Map<id, Node>
 *
 * @param {number} assignmentId - The Assignment ID to scope the nodes to
 * @returns {Object}
 */
module.exports = function(assignmentId, callback) {
  var data = {
    nodes: {},
    assignment: Assignment.cache.read(assignmentId),
  };

  // Make a copy of the node store
  var tmp = {};
  _.extend(tmp, Node.cache.list(assignmentId));

  // Form a Map<Node.id, Node>
  _.each(tmp, function(node, key) { data.nodes[node.id] = node; });

  chrome.tabs.query({currentWindow: true}, function(tabs) {
    // two(!) methods to ensure opentabs are emphasised in UI 
    //get currently open tab urls
    var tabUrls = _.pluck(tabs, 'url');
    _.each(data.nodes, function(node, id) {
      var index = tabUrls.indexOf(node.url);
      if (index > -1) {
      //if node url matches open tab url set the node.tabId property
        data.nodes[id].tabId = tabs[index].id;
      };
    });

    // If any tabs are open as shown in tabIdMap, set them as properties on the nodes
    _.each(tabIdMap, function(map, key) {
      if (data.nodes[map]) {
        data.nodes[map].tabId = key;
      }
    });

    return callback(data);
  });
};