var React     = require('react')
  , domready  = require('domready');

// Popup 'App' component
var App = require('./popup/app');

domready(function() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    if (tabs[0]) {
      React.render(
        React.createElement(App, { tabId: tabs[0].id }), document.body);
    }
  });
});
