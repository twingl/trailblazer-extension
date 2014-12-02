var React = require('react/addons')
var domready = require('domready');
var constants =	require('./constants');

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

	console.log('ui action dispatched', actionName, payload)
	//SEND
	// override the fluxxor
  // this allows the background and content to share the same actions
  chrome.runtime.sendMessage({action: actionName, payload: payload});
};

var app = App(state, actions);

chrome.runtime.onMessage.addListener(
	function handleMessage(message) {
		// RECEIVE
		//only handles STATE change event (background handles ACTION messages)
		console.log('messgae recieved from background!', message)
		switch (message.type) {
			//whitelist of types that trigger a UI state change
			case 'LOAD_ASSIGNMENTS':
			case 'LOAD_ASSIGNMENTS_SUCCESS':
			case 'LOAD_ASSIGNMENTS_FAIL':
			case 'LOAD_NODES':
				console.log('gonna update app')
				app.update(message);
				break;
			default:
				return;
		}

});

// TODO?
// actions.init(); // refresh the store to get whatever existing data