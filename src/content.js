var React = require('react/addons')
var domready = require('domready');

var actions = require('./actions.js');
var state;
var app = require('./content/app.js')(state, actions);

chrome.runtme.onMessage.addListener(
	function handleMessage(message) {
		//only handles STATE change event (background handles ACTION messages)
		if (message.type === 'change') app.update(message.payload);
});

actions.dispatch = function(actionName, payload) { // override the fluxxor
  // this allows the background and content to share the same actions
  chrome.runtime.sendMessage({type: actionName, payload: payload});
};

// TODO?
// actions.init(); // refresh the store to get whatever existing data