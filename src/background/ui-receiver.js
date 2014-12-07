var info      = require('debug')('background/ui-receiver.js:info')
  , constants = require('../constants');

/**
 * Listen for select messages that are sent over chrome.runtime and dispatch
 * their actions
 */
module.exports = function (flux) {
  return function (message) {
    info("Received message over chrome.runtime", {message: message});

    switch (message.action) {
      case constants.LOAD_ASSIGNMENTS:
        flux.actions.loadAssignments();
        break;
      case constants.LOAD_NODES:
        flux.actions.loadNodes(message.payload);
        break;
      case constants.SELECT_ASSIGNMENT:
        flux.actions.selectAssignment(message.payload.assignmentId);
        break;
    }
  }
};
