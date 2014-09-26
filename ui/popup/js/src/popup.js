var React = require('react');
var TrailTitle = require('app/components/trail-title');

chrome.runtime.sendMessage({action: 'getCurrentAssignment'}, function(response) {
  console.log('trail', response)
})

React.renderComponent(
  <TrailTitle value={"test"} />,
  document.getElementById('recording-title'));

