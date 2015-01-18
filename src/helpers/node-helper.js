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

    data.rank = (node.rank) ? node.rank : 0;
    if (node.parentId) data.parent_id         = node.parentId;
    if (node.redirect) data.redirect          = node.redirect;
    if (node.redirectedTo) data.redirected_to = node.redirectedTo;

    return data;
  }
}

module.exports = NodeHelper;
