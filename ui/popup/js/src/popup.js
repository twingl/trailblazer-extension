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

    React.renderComponent(
      <TrailTitle id={assignmentId} title={title} />,
      document.getElementById('assignment-title')
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
