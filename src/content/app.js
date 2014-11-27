/** @jsx React.DOM */

//helpers
var React = require('react/addons');
var _ = require('lodash');
var domready = require('domready');
var isArray = require('is-array');
var Immutable = require('immutable');

var constants = require('../constants');


//components
var AssignmentsIndex = require('app/components/assignments-index');
var AssignmentsShow  = require('app/components/assignments-show');

//setup routes
var RouterMixin     = require('react-mini-router').RouterMixin
 ,  navigate        = require('react-mini-router').navigate;

var App = React.createClass({

  mixins: [
    RouterMixin
  ],

  routes: {
    '/':                'assignmentsIndex',
    '/assignments':     'assignmentsIndex',
    '/assignments/:id': 'assignmentsShow'
  },

  render: function () {
    console.log('rendering app', this.props.state);
    return this.renderCurrentRoute();
  },


  /**
   * Assignments#index - borrowing naming conventions from Rails
   */
  assignmentsIndex: function () {
    console.log('assignmentsIndex fired', this.props.state)
    this.props.actions.dispatch(constants.LOAD_ASSIGNMENTS);

    return <AssignmentsIndex 
              state={this.props.state} 
              actions={this.props.actions} 
              selectMap={this.selectMap} />
  },

  /**
   * Assignments#show - borrowing naming conventions from Rails
   */
  assignmentsShow: function () {
    return <AssignmentsShow state={this.props.state} actions={this.props.actions}/>
  },

  // componentWillMount: function () {
  //   this.getFlux().actions.loadAssignments();
  //   console.log('component mounting');
  // },

  selectAssignment: function (assignmentId) {
    console.log('assignmentId in selectAssignment', assignmentId)
    throw "not implemented"
    this.props.actions.dispatch(constants.LOAD_NODES, assignmentId);
    navigate('/assignments/'+assignmentId);
  }
});

var AppWrap = function(initialState, actions) {
  var app = {
    initialize: function() {
      var initialState = initialState || {};

      // nodeState: Map
        // loading: Boolean
        // error: String
        // nodeIndex: Map
      // assignmentState: Map
      //   loading: Boolean
      //   error: String
      //   assignmentsIndex: Map
      //   currentAssignment: Integer

      this.state = Immutable.fromJS(initialState);
      this.update();
      return this;
    },

    update: function(message) {
      if (message && message.type) {
        switch (message.type) {
          case constants.LOAD_ASSIGNMENTS:
            this.updateAssignmentState('loading', true);
            break;
          case constants.LOAD_ASSIGNMENTS_SUCCESS:
            this.refreshAssignments(message.payload.assignments);
            break;
          case constants.LOAD_ASSIGNMENTS_FAIL:
            this.updateAssignmentState('error', message.payload.error);
        }
      }
      React.renderComponent(<App actions={actions} state={this.state}/>, document.body);
    },

    updateAssignmentState: function (key, value) {
      this.state.updateIn(['assignmentState', key], function () { return value });
    },

    refreshAssignments: function (assignments) {
      //translate from array to an immutable map
      this.state.updateIn(['assignmentState', 'assignmentsIndex'], function () {
        return Immutable.Map(assignments.reduce(function (o, assignment) {
          o[assignment.id] = assignment;
          return o;
        }))
      })
    },




  };




  return app.initialize();
};

module.exports = AppWrap;
