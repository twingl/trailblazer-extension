var React     = require('react')
  , config    = require('../config').raven
  , domready  = require('domready');

// Start tracking errors
var Raven = require('raven-js');
if (config.url) Raven.config(config.url).install();

// Popup 'App' component
var App = React.createFactory(require('../popup/app'));

domready(function() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    if (tabs[0]) {
      React.render( App({ tabId: tabs[0].id, history: false }), document.body);
    }
  });
});
