/** @jsx React.DOM */
var React = require('react');
var MapTitle = require('app/components/map-title');
var Star = require('app/components/star');
var domready = require('domready');

domready(function() {
  chrome.runtime.sendMessage({action: 'getCurrentAssignment'}, function (response) {
    var title = response.title || 'New Trail';
    var assignmentId = response.id || null;

    React.renderComponent(
      <MapTitle id={assignmentId} title={title} />,
      document.getElementById('map-title')
    );

    //probably a better pattern than nested messaging
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      if (tabs.length > 0) {
        chrome.runtime.sendMessage({action: 'getNode', tabId: tabs[0].id}, function (response) {
          var rank = (response && response.node) ? response.node.rank : 0;
          React.renderComponent(
            <Star id={response.node.id} width={16} height={15} rank={rank}/>,
            document.getElementById('waypoint-div')
          );
        });
      }
    });
  });

  chrome.runtime.sendMessage({action: ''})
});
