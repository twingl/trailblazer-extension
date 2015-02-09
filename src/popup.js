var React     = require('react')
  , domready  = require('domready');

// Popup 'App' component
var App = React.createFactory(require('./popup/app'));

domready(function() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    if (tabs[0]) {
      React.render( App({ tabId: tabs[0].id, history: false }), document.body);
    }
  });
});
