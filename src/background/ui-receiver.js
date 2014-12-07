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
      case constants.FETCH_ASSIGNMENTS:
        flux.actions.fetchAssignments();
        break;
      case constants.LOAD_NODES:
        flux.actions.loadNodes(message.payload);
        break;
      case constants.SELECT_ASSIGNMENT:
        flux.actions.selectAssignment(message.payload.assignmentId);
        break;
      default:
        info("Ignoring received message \"" + message.action + "\": no action bound.");
        console.log(flux);
    }
  }
};
