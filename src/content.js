var React = require('react/addons')
var domready = require('domready');
var constants =	require('./constants');
var info 			= require('debug')('content.js:info');

var actions = require('./actions.js');
var state = {
      nodeState: {
      	loading: false,
      	error: null,
      	nodeIndex: {}
      },
      assignmentState: {
        loading: false,
        error: null,
        assignmentsIndex: {},
        currentAssignment: null
      }
};

var App = require('./content/app.js');

var app = App(state, actions);

// Listen for actions, and react to ones that the UI cares about
chrome.runtime.onMessage.addListener(function (message) {
  switch (message.action) {
    // White-list of actions that trigger a UI state change
    case constants.FETCH_ASSIGNMENTS:
    case constants.FETCH_ASSIGNMENTS_FAIL:
    case constants.ASSIGNMENTS_SYNCHRONIZED:
      info("Action: ", message);
      // TODO Update our state objects here before updating the app
      app.update(message);
      break;

    // Extra case for 'change' events emitted by the stores
    case 'change':
      info("Change: ", message);
      app.update(message);
      break;

    // Log anything we don't explicitly handle
    default:
      info("Ignoring message " + message.action, message);
      return;
  }
});

// TODO?
// actions.init(); // request the store's existing data
