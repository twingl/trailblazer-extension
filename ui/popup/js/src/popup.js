/** @jsx React.DOM */
var React = require('react');
var TrailTitle = require('app/components/trail-title');
var domready = require('domready');

domready(function() {
  chrome.runtime.sendMessage({action: 'getCurrentAssignment'}, function (response) {
    var title = response.title || 'New Trail';
    var id = response.id || null;
    React.renderComponent(
      <TrailTitle title={title} id={id} />,
      document.getElementById('assignment-title')
    );
  });
});
