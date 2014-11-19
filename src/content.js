//main
var React = require('react/addons')
var domready = require('domready');

var actions = require('./actions.js');
var App = require('./content/app.js');

var Fluxxor = require('fluxxor');
var NodeStore = require('./stores/node-store');
var AssignmentStore = require('./stores/assignment-store');
var stores = {
  NodeStore: new NodeStore(),
  AssignmentStore: new AssignmentStore()
};
var flux = new Fluxxor.Flux(stores, actions);
//logging
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});

React.render(<App flux={flux} history={true} />, document.body);
