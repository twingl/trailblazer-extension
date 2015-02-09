var React     = require('react')
  , domready  = require('domready');

// Content 'App' component
var App = React.createFactory(require('./content/app'));

domready(function() {
  React.render( App({ history: false }), document.body);
});
