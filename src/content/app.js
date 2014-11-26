/** @jsx React.DOM */

//helpers
var d3ify = require('app/d3ify');
var React = require('react/addons');
var Fluxxor = require('fluxxor');
var _ = require('lodash');
var domready = require('domready');
var isArray = require('is-array');

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
    console.log('rendering app', this.state);
    return this.renderCurrentRoute();
  },


  /**
   * Assignments#index - borrowing naming conventions from Rails
   */
  assignmentsIndex: function () {
    console.log('assignmentsIndex fired', this.props.state)

    return <AssignmentsIndex state={this.props.state} actions={this.props.actions} selectMap={this.selectMap} />
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
    this.props.actions.dispatch()
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

module.exports = AppWrap;
