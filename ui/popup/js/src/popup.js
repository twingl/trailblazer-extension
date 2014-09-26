/** @jsx React.DOM */
var React = require('react');
var TrailTitle = require('app/components/trail-title');
var domready = require('domready');

domready(function() {
console.log(document.getElementById('recording-title'))

React.renderComponent(
  <TrailTitle value="test" />,
  document.getElementById('recording-title'));
})





