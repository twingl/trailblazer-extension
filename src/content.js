var React = require('react/addons')
var domready = require('domready');

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

var app = require('./content/app.js')(state, actions);

chrome.runtme.onMessage.addListener(
	function handleMessage(message) {
		// RECEIVE
		//only handles STATE change event (background handles ACTION messages)

		switch (message.type) {
			//whitelist of types that trigger a UI state change
			case 'LOAD_MAPS':
			case 'LOAD_MAPS_SUCCESS':
			case 'LOAD_MAPS_FAIL':
			case 'LOAD_NODES':
				app.update(message);
				break;
			default:
				return;
		}

});

actions.dispatch = function(actionName, payload) { 
	//SEND
	// override the fluxxor
  // this allows the background and content to share the same actions
  chrome.runtime.sendMessage({type: actionName, payload: payload});
};

// TODO?
// actions.init(); // refresh the store to get whatever existing data