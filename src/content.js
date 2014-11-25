//main
var React = require('react/addons')
var domready = require('domready');

var actions = require('./actions.js');
var App = require('./content/app.js');

chrome.runtme.onMessage.addListener(
	function handleMessage(state) {
		//TODO ensure this only handles STATE change event (background handles ACTION messages)
		App.update(state);
})


actions.dispatch = function(actionName, payload) { // override the fluxxor
  // this allows the background and content to share the same actions
  chrome.runtime.sendMessage({type: actionName, payload: payload});
};






React.render(<App flux={flux} hash={window.location.hash} />, document.body);
