/** @jsx React.DOM */

//helpers
var d3ify = require('app/d3ify');
var React = require('react/addons');
var Fluxxor = require('fluxxor');
var _ = require('lodash');
var domready = require('domready');

//setup stores, actions and flux
var NodeStore = require('../stores/node-store');
var AssignmentStore = require('../stores/assignment-store');
var stores = {
  NodeStore: new NodeStore(),
  AssignmentStore: new AssignmentStore()
};
var actions = require('../actions');
var flux = new Fluxxor.Flux(stores, actions);

var FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin;

//logging
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});

//components
var AssignmentList  = require('app/assignment-list');
var Map             = require('app/map');

var App = React.createClass({

  mixins: [FluxMixin, StoreWatchMixin('AssignmentStore', 'NodeStore')],

  getInitialState: function() {
    //QUESTION: might use props instead!
    return {
      mode: 'ASSIGNMENTS'
    };
  },

  //bind top level component to 'change' events on stores
  getStateFromFlux: function() {
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
    switch (this.state.mode) {
      case 'ASSIGNMENTS':
        return this.renderAssignments();
      case 'MAP':
      default:
        return this.renderMap();
    }
  },

  renderAssignments: function () {
    console.log('im rederng')

    console.log(this.state.AssignmentState)
  },

  renderMap: function () {

  },

  componentDidMount: function () {
    if (this.state.mode === 'ASSIGNMENTS') this.getFlux().actions.loadAssignments();

  }



});


var AppWrap = function(initialState, actions) {
  var app = {
    initialize: function() {
     // this._layer = DOM('<div class="{className}"></div>', {className: RESET_CLASSNAME})[0];
     // DOM('body').add(this._layer);
     this.update(initialState);
     return this;
    },

    update: function(state) {
      React.renderComponent(<App actions={actions} st={state}/>, document.getElementsByTagName('body')[0]);
    }
  }

  return app.initialize();
};

module.exports = App;





