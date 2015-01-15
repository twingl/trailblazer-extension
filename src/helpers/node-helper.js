var NodeHelper = {
  isChild: function(node, candidateChild) {
    return (candidateChild.localParentId && candidateChild.localParentId === node.localId);
  },

  isParent: function(node, canidateParent) {
    return (canidateParent.localId && canidateParent.localId === node.localParentId);
  },

  isOpenTab: function(node) {
    return !!node.tabId;
  },

  getAPIData: function (node) {
    var data = {
      url: node.url,
      title: node.title
    };

    if (node.rank) data.rank = node.rank;
    if (node.parentId) data.parent_id = node.parentId;

    return data;
  }
}

module.exports = NodeHelper;
