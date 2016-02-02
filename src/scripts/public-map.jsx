//helpers
var ReactDOM = require('react-dom');

//components
var PublicMapView = require('../components/views/public-map');

window.renderMap = function(assignment, nodes) {
  var data = {
    nodes: {},
    assignment: undefined
  };

  data.assignment = assignment;

  nodes.map((node) => {
    node.localId            = node.id;

    node.parentId           = node.parent_id;
    node.localParentId      = node.parent_id;

    node.assignmentId       = node.assignment_id;
    node.localAssignmentId  = node.assignment_id;

    data.nodes[node.id]     = node;
  });

  console.log(data);

  ReactDOM.render(
    <PublicMapView
        assignment={data.assignment}
        nodes={data.nodes} />,
    document.getElementById('wrap')
  );
};
