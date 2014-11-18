/** @jsx React.DOM */

//helpers
var d3ify = require('app/d3ify');
var React = require('react/addons');
var Fluxxor = require('fluxxor');
var _ = require('lodash');
var domready = require('domready');
var isArray = require('is-array');

//setup stores, actions and flux

var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

//components
var AssignmentList  = require('app/components/assignment-list');
var Map             = require('app/components/map');

var App = React.createClass({

  mixins: [FluxMixin, StoreWatchMixin('AssignmentStore', 'NodeStore')],

  getInitialState: function() {
    return {
      assignmentId: null
    };
  },

  //bind top level component to 'change' events on stores
  getStateFromFlux: function() {
    console.log('calling getStateFromFlux', this)
    var flux = this.getFlux();

    var NodeStore = flux.store('NodeStore');
    var AssignmentStore = flux.store('AssignmentStore');
    return {
      nodeState: {
        loading: NodeStore.loading,
        error: NodeStore.error,
        nodes: NodeStore.getState().nodes
      },
      AssignmentState: {
        loading: AssignmentStore.loading,
        error: AssignmentStore.error,
        assignments: AssignmentStore.getState().assignments
      }
    };
  },

  render: function () {
    console.log('rendering in app', this.props, this.state)
    var assignments = this.state.AssignmentState.assignments;
    var items = assignments ? _.values(assignments) : [];
    return <this.props.activeRouteHandler state={this.state} select={this.selectAssignment} />
  },

  componentDidMount: function () {
    console.log('component mounting');
    this.getFlux().actions.loadAssignments();
  },

  selectAssignment: function (assignmentId) {
    console.log('assignmentId in selectAssignment', assignmentId)
    this.setState({ assignmentId: assignmentId });
    window.location.href = "/assignments/" + assignmentId

  }



});

module.exports = App;





