var React     = require('react')
  , domready  = require('domready');

// Content 'App' component
var App = require('./content/app');

domready(function() {
  React.render( React.createElement(App, {
    history: false
  }), document.body);
});
