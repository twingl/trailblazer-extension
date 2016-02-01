var React     = require('react')
  , config    = require('../config').raven
  , domready  = require('domready');

// Start tracking errors
var Raven = require('raven-js');
if (config.url) Raven.config(config.url).install();

// Content 'App' component
var App = React.createFactory(require('../content/app'));

domready(function() {
  React.render( App({ history: false }), document.body);
});
