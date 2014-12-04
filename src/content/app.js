/** @jsx React.DOM */

//helpers
var React = require('react/addons');
var _ = require('lodash');
var domready = require('domready');
var isArray = require('is-array');
var Immutable = require('immutable');

var constants = require('../constants');
var log = require('debug')('content:app.js');


//components
var AssignmentsIndex = React.createFactory(require('app/components/assignments-index'));
var AssignmentsShow  = React.createFactory(require('app/components/assignments-show'));

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

  // shouldComponentUpdate: function (nextProps) {
  //   if (nextProps.state !== this.props.state) { 
  //     return true 
  //   } else { 
  //     return false 
  //   };
  // },

  componentDidMount: function () {
   this.props.actions.dispatch(constants.LOAD_ASSIGNMENTS);
  },


  /**
   * Assignments#index - borrowing naming conventions from Rails
   */
  assignmentsIndex: function () {
    console.log('assignmentsIndex fired', this.props.state)
 

    return <AssignmentsIndex 
              state={this.props.state} 
              actions={this.props.actions} 
              select={this.selectAssignment} />
  },

  /**
   * Assignments#show - borrowing naming conventions from Rails
   */
  assignmentsShow: function () {
    console.log('assignmentsShow')
    return <AssignmentsShow state={this.props.state} actions={this.props.actions}/>
  }
});

var AppWrap = function(initialState, actions) {

  var app = {
    initialize: function(initialState) {
      console.log('initialState', initialState)
      var initialState = initialState || {};
      console.log('initialState', initialState)


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
      console.log('app updating', message)
      if (message && message.type) {
        switch (message.type) {
          case constants.LOAD_ASSIGNMENTS:
            this.updateAssignmentState('loading', true);
            break;
          case constants.ASSIGNMENTS_READY:
            this.refreshAssignments(message.payload.assignments);
            break;
          case constants.LOAD_ASSIGNMENTS_FAIL:
            this.updateAssignmentState('error', message.payload.error);
          case constants.NODES_READY:
            this.addNodes(message.payload.nodes);
          case constants.CURRENT_ASSIGNMENT_CHANGED:
            this.updateAssignmentState('currentAssignment', message.payload.assignmentId);
        }
      }
      this.render();
    },

    render: function () {
      console.log('re-render', this.state)
      React.renderComponent(<App actions={actions} state={this.state}/>, document.body);
    },

    updateAssignmentState: function (key, value) {
      this.state.updateIn(['assignmentState', key], function () { return value });
    },

    refreshAssignments: function (assignments) {
      console.log('refreshAssignments fired', assignments)
      //translate from array to an immutable map

      var assignmentsIndex = Immutable.Map(assignments.reduce(function (o, assignment) {
          o[assignment.id] = assignment;
          return o;
        }, {})); 

      console.log(assignmentsIndex)

      this.state = this.state.updateIn(['assignmentState', 'assignmentsIndex'], function () {
        return assignmentsIndex;
      });
    },

    addNodes: function (nodes) {
      nodes.forEach(function (node) {
        this.state.updateIn['nodeState', 'nodeIndex', node.id], function () {
          return node;
        }
      }.bind(this))
    }
  };




  return app.initialize(initialState);
};

module.exports = AppWrap;
