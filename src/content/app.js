/** @jsx React.DOM */

//helpers
var d3ify = require('app/d3ify');
var React = require('react/addons');
var Fluxxor = require('fluxxor');
var _ = require('lodash');
var domready = require('domready');
var isArray = require('is-array');

//components
var AssignmentList = require('app/components/assignment-list');
var MapView        = require('app/components/map-view');

//setup stores, actions and flux
var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

//TODO make an action
var shareAction = function(assignmentId, bool) {
  chrome.runtime.sendMessage({ 
    action: 'updateAssignment', 
    assignmentId: assignmentId, 
    props: {
      visible: bool
    }
  })
};


var App = React.createClass({

  mixins: [FluxMixin, StoreWatchMixin('AssignmentStore', 'NodeStore')],

  getInitialState: function() {
    return {
      assignmentId: null,
      mode: 'ASSIGNMENTS'
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
    console.log('rendering app', this.state)

    switch (this.state.mode) {
      case 'ASSIGNMENTS':
        return <AssignmentList state={this.state} select={this.selectAssignment} />
      case "MAP":
        return <MapView state={this.state} shareAction={shareAction}/>
    }

  },

  componentDidMount: function () {
    console.log('component mounting');
    this.getFlux().actions.loadAssignments();
  },

  selectAssignment: function (assignmentId) {
    console.log('assignmentId in selectAssignment', assignmentId)
    this.getFlux().actions.loadNodes(assignmentId);
    this.setState({ 
      assignmentId: assignmentId,
      mode: 'MAP'
    });
    
  }



});

module.exports = App;





