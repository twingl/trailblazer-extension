var render = require('app/render');
var d3ify = require('app/d3ify');
var _ = require('lodash');
var assignmentId;
var chrome = window.chrome;

if (window.location.hash) {
  var o = {};
  _.each(window.location.hash.substring(1).split('&'), function(i) {
    var kv = i.split('=');
    o[kv[0]] = kv[1];
  });
  assignmentId = parseInt(o.assignment);
};

var getMap =  function(assignmentId) {
  chrome.runtime.sendMessage({ action: "getMap", assignmentId: assignmentId }, function(response) {
      if (response.data && response.data.nodes && Object.keys(response.data.nodes).length > 0) {
        render("#map", d3ify( response.data ));
      };
    });
};

//listen for updates to an assignment's nodes and render map
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
  if (request.action === "updatedNodes" && request.assignmentId === assignmentId) {
    getMap(assignmentId);
  };
});

getMap(assignmentId);


