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

//setup routes
var RouterMixin     = require('react-mini-router').RouterMixin
 ,  navigate        = require('react-mini-router').navigate;

var App = React.createClass({

  mixins: [
    RouterMixin
  ],

  routes: {
    '/': 'showAssignments',
    '/assignments': 'showAssignments',
    '/assignments/:id': 'showMap' 
  },

  render: function () {
    console.log('rendering app', this.state);
    return this.renderCurrentRoute();
  },

  showAssignments: function () {
    console.log('showAssignments fired', this.props.state)

    return <AssignmentList state={this.props.state} actions={this.props.actions} selectMap={this.selectMap} />
  },

  showMap: function () {
    return <MapView state={this.props.state} actions={this.props.actions}/>
  },

  // componentWillMount: function () {
  //   this.getFlux().actions.loadAssignments();
  //   console.log('component mounting');
  // },

  selectMap: function (mapId) {
    console.log('mapId in selectAssignment', mapId)
    this.props.actions.dispatch()
    this.setState({ 
      mapId: mapId,
      mode: 'MAP'
    });
    navigate('/assignments/'+mapId);
    
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





