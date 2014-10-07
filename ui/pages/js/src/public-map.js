/** @jsx React.DOM */
//helpers
var React = require('react');
require('../../styles/map.css');
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
    node.parentId       = node.parent_id;
    node.assignmentId   = node.assignment_id;
    data.nodes[node.id] = node;
  });

  console.log(data);

  React.renderComponent(
    <PublicMapView title={assignment.title} data={data} />,
    document.getElementsByTagName('body')[0]
  );
};
