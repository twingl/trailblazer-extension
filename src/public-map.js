/** @jsx React.DOM */
//helpers
var React = require('react');
var _ = require('lodash');

//components
var PublicMapView = require('app/components/public-map-view');

window.renderMap = function(assignment, nodes) {
  var data = {
    nodes: {},
    assignment: undefined
  };

  data.assignment = assignment;

  _.each(nodes, function(node) {
    node.localId            = node.id;

    node.parentId           = node.parent_id;
    node.localParentId      = node.parent_id;

    node.assignmentId       = node.assignment_id;
    node.localAssignmentId  = node.assignment_id;

    data.nodes[node.id]     = node;
  });

  console.log(data);

  React.render(
    <PublicMapView
        assignment={data.assignment}
        nodes={data.nodes} />,
    document.getElementById('wrap')
  );
};
