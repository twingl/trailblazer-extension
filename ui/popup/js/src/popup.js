/** @jsx React.DOM */
var React = require('react');
var TrailTitle = require('app/components/trail-title');
var Star = require('app/components/star');
var domready = require('domready');

domready(function() {
  chrome.runtime.sendMessage({action: 'getCurrentAssignment'}, function (response) {
    console.log('assignment', response);
    var title = response.title || 'New Trail';
    var assignmentId = response.id || null;
    var currentNodeId = response.currentNodeId;

    React.renderComponent(
      <TrailTitle id={assignmentId} title={title} />,
      document.getElementById('assignment-title')
    );

    //probably a better pattern than nested messaging
    chrome.runtime.sendMessage({action: 'getNode', nodeId: currentNodeId}, function (response) {
      console.log('node response', response)
      var rank = (response && response.node) ? response.node.rank : 0;
      React.renderComponent(
        <Star id={currentNodeId} width={16} height={15} rank={rank}/>,
        document.getElementById('waypoint-div')
      );
    });
  });

  chrome.runtime.sendMessage({action: ''})
});
