var _ = require('lodash');

module.exports = function(nodeObj) {
    // Initialize the final containers that will be given to D3 to render
    var links = [];
    var nodes = [];

    // We need to convert our trees into a list of nodes and links.
    // Keep track of the index so that we can associate the array of nodes/links
    // with their respective locations in the original object
    var index = 0;
    var idMap = {};

    // Iterate over nodes to insert them into an array with known indices
    _.each(nodeObj, function(node) {
      // Record the relationship between index and location in the original
      // object
      idMap[node.localId] = {
        index: index++,
        treeId: node.treeId,
        nodeId: node.localId
      };

      // Initialize the child-node link counter for the next iterator
      node.childCount = 0;

      // If we don't have an x or y value set, remove the null
      if (!node.x) delete node.x;
      if (!node.y) delete node.y;

      // Add the node to the rendering list of nodes
      nodes.push(node);
    });

    // Iterate over the nodes a second time to create links
    _.each(nodeObj, function(node) {
      // Add a link to the rendering list if there's a relationship present.
      // Note the directionality: parentNode -> node
      if (node.localParentId && idMap[node.localParentId]) {
        // Increment the link counter on the parent node so we can identify
        // hubs ( >=3 child nodes )
        nodeObj[node.localParentId].childCount += 1;

        links.push({
          source: idMap[node.localParentId].index,
          target: idMap[node.localId].index
        });
      }
    });

    return {
      nodes: nodes,
      links: links
    };
  };
