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

actions.dispatch = function(actionName, payload) { 
	info('ui action dispatched', { action: actionName, payload: payload })
	// override the fluxxor
  // this allows the background and content to share the same actions
  chrome.runtime.sendMessage({action: actionName, payload: payload});
};

var app = App(state, actions);

chrome.runtime.onMessage.addListener(
	function handleMessage(message) {
		info('message recieved from background!', { message: message })
		// RECEIVE
		//only handles STATE change event (background handles ACTION messages)
		switch (message.type) {
			//whitelist of types that trigger a UI state change
			case 'LOAD_ASSIGNMENTS':
			case 'ASSIGNMENTS_READY':
			case 'LOAD_ASSIGNMENTS_FAIL':
			case 'LOAD_NODES_FAIL':
			case 'NODES_READY':
			case 'CURRENT_ASSIGNMENT_CHANGED':
				app.update(message);
				break;
			default:
				return;
		}

});

// TODO?
// actions.init(); // refresh the store to get whatever existing data
