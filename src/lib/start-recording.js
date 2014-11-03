var getNode = require('./get-node');
var Assignment = require('../model/assignment');
var Promise = require('promise');


module.exports = function(tabId, assignmentId) {
  if (!getNode(tabId).recording) {
    var assignment;
    if (assignmentId) {
      // It's an existing assignment
      assignment = Assignment.cache.read(assignmentId);
    } else {
      // We need to create a new assignment
      assignment = new Assignment();
    }

    assignment.currentNodeId = getNode(tabId).id;

    // Ensure we have a valid ID for the assignment so we can start saving
    // the trail
    return new Promise(function(resolve, reject) {
      assignment.save().then(function(assignment) {
        getNode(tabId).assignmentId = assignment.id;
        getNode(tabId).recording = true;
        getNode(tabId).save();
        // TODO Feature? Iterate over the existing, in-memory nodes and save the
        // connected graph - this will save the entire tree, if desirable.
        // Pending team discussion
        resolve();
      }.bind(this),
      function() {
        reject();
      });
    }.bind(this));
  }
};