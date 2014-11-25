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
var FluxMixin       = Fluxxor.FluxMixin(React)
 ,  StoreWatchMixin = Fluxxor.StoreWatchMixin
 ,  RouterMixin     = require('react-mini-router').RouterMixin
 ,  navigate        = require('react-mini-router').navigate;


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

  update: function (state) {
    this.setState(state);
  }

  mixins: [
    RouterMixin
  ],

  routes: {
    '/': 'showAssignments',
    '/assignments': 'showAssignments',
    '/assignments/:id': 'showMap' 
  },

  // getInitialState: function() {
  //   return {
  //     assignmentId: null,
  //     mode: 'ASSIGNMENTS',
  //     nodeState: {
  //       loading: false,
  //       error: null,
  //       nodeMap: NodeStore.getState().nodeMap
  //     },
  //     AssignmentState: {
  //       loading: AssignmentStore.loading,
  //       error: AssignmentStore.error,
  //       assignmentMap: AssignmentStore.getState().assignmentMap
  //     }
  //   };
  // },

  // //bind top level component to 'change' events on stores
  // getStateFromFlux: function() {
  //   console.log('calling getStateFromFlux', this)
  //   var flux = this.getFlux();

  //   var NodeStore = flux.store('NodeStore');
  //   var AssignmentStore = flux.store('AssignmentStore');
  //   return {
  //     nodeState: {
  //       loading: NodeStore.loading,
  //       error: NodeStore.error,
  //       nodeMap: NodeStore.getState().nodeMap
  //     },
  //     AssignmentState: {
  //       loading: AssignmentStore.loading,
  //       error: AssignmentStore.error,
  //       assignmentMap: AssignmentStore.getState().assignmentMap
  //     }
  //   };
  // },

  render: function () {
    console.log('rendering app', this.state);
    return this.renderCurrentRoute();
  },

  showAssignments: function () {
    console.log('showAssignments fired')
    return <AssignmentList state={this.props.state} actions={this.props.actions} />
  },

  showMap: function () {
    return <MapView state={this.props.state} actions={this.props.actions}/>
  },

  componentWillMount: function () {
    this.getFlux().actions.loadAssignments();
    console.log('component mounting');
  },

  // componentWillUpdate: function (nextProps, nextState) {
  // //controler logic

  // //if nextState.nodeState.nodeMap is new -> save nodes



  // },

  selectAssignment: function (assignmentId) {
    console.log('assignmentId in selectAssignment', assignmentId)
    this.getFlux().actions.loadNodes(assignmentId);
    this.setState({ 
      assignmentId: assignmentId,
      mode: 'MAP'
    });
    navigate('/assignments/'+assignmentId);
    
  }
});


var AppWrap = function(initialState, actions) {
  var app = {
    initialize: function() {
     this.update(initialState);
     return this;
    },

    update: function(state) {
      React.renderComponent(<App actions={actions} state={state}/>, document.body);
    }
  }

  return app.initialize();
};


console.log('app', App)


module.exports = App;





