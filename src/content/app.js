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

  mixins: [FluxMixin, StoreWatchMixin('AssignmentStore'), StoreWatchMixin('NodesStore')],

  getInitialState: function() {
    return {
      mode: 'ASSIGNMENTS'
    };
  },

  getStateFromFlux: function(name) {
    //name = 'nodes' || 'assignments'; storeName = 'NodeStore' || 'AssignmentStore'
    var storeName = name[0].toUpperCase() + name.slice(1, -1) + "Store"

    var store = this.getFlux().store(storeName);
    return {
      loading: store.loading,
      error: store.error,
      assignments: store[name]
    };
  },

  render: function() {
    switch (this.state.mode) {
      case 'ASSIGNMENTS':
        return this.renderTrails();
      case 'MAP':
      default:
        return this.renderMap();
    }
  },

  renderAssignments: function() {

  },

  renderMap: function() {

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
      React.renderComponent(<App actions={actions} ={state}/>, document.getElementsByTagName('body')[0]);
    }
  }

  return app.initialize();
};

module.exports = AppWrap;




// //components
// var MapView = require('app/components/map-view');

// //variables
// var assignmentId;
// var chrome = window.chrome;

// var shareAction = function(assignmentId, bool) {
//   chrome.runtime.sendMessage({ 
//     action: 'updateAssignment', 
//     assignmentId: assignmentId, 
//     props: {
//       visible: bool
//     }
//   })
// };

// var getMap =  function(assignmentId) {
//   chrome.runtime.sendMessage({ action: "getMap", assignmentId: assignmentId }, function(response) {
//       if (response.data && response.data.nodes && Object.keys(response.data.nodes).length > 0) {
//         React.renderComponent(
//           <MapView 
//             mapURL={response.data.assignment.url}
//             shareAction={shareAction}
//             assignmentId={assignmentId}
//             visible={response.data.assignment.visible}
//             title={response.data.assignment.title} 
//             data={response.data} />,
//           document.getElementsByTagName('body')[0]
//         );
//       };
//     });
// };

// if (window.location.hash) {
//   var o = {};
//   _.each(window.location.hash.substring(1).split('&'), function(i) {
//     var kv = i.split('=');
//     o[kv[0]] = kv[1];
//   });
//   assignmentId = parseInt(o.assignment);
// };

// //listen for updates to an assignment's nodes and render map (unused)
// chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
//   if (request.action === "updatedNodes" && request.assignmentId === assignmentId) {
//     getMap(assignmentId);
//   };
// });

// chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
//   if (request.action === "updatedAssignment" && request.assignment.id === assignmentId) {
//     getMap(assignmentId);
//   };
// });

// domready(function() {
//   getMap(assignmentId);
// });




