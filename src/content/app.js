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
    //QUESTION: might use props instead!
    return {
      mode: 'ASSIGNMENTS',
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
    console.log('rendering', this.state)
    var assignments = this.state.AssignmentState.assignments;
    var items = assignments ? _.values(assignments) : [];
    console.log('items', items)
    return <AssignmentList items={items} select={this.selectAssignment}  />
  },

  componentDidMount: function () {
    console.log('component mounting');
    if (this.state.mode === 'ASSIGNMENTS') { this.getFlux().actions.loadAssignments(); }
  },

  selectAssignment: function (assignmentId) {
    console.log('assignmentId in selectAssignment', assignmentId)
    this.setState({ 
      assignmentId: assignmentId
      mode: });
  }



});


// var AppWrap = function(initialState, actions) {
//   var app = {
//     initialize: function() {
//      // this._layer = DOM('<div class="{className}"></div>', {className: RESET_CLASSNAME})[0];
//      // DOM('body').add(this._layer);
//      this.update(initialState);
//      return this;
//     },

//     update: function(state) {
//       React.renderComponent(<App actions={actions} st={state} />, document.getElementsByTagName('body')[0]);
//     }
//   }

//   return app.initialize();
// };

module.exports = App;





