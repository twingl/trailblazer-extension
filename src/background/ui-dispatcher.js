var info = require('debug')('background/ui-dispatcher.js:info');

/**
 * This is the main entry point for communications to the UI. It handles events
 * destined to update the UI, and dispatches them over chrome runtime
 * messaging.
 */
var UIDispatcher = function(flux, stores) {
  var dispatcher = {

    // Bind dispatch to each store
    initialize: function () {
      for (var i = 0; i < stores.length; i++) {
        flux.store(stores[i]).on('update-ui', this.dispatch);
      }
      info("Initialized UIDispatcher", { stores: stores });
    },

    // Dispatch the action over chrome.runtime to the UI
    //
    // Instead of pushing Actions over chrome.runtime, it should just send the store `change` events.
    // The UI is only concerned with data changes, and the back end should know
    // nothing about what's handling the store change events.
    // This would involve renaming 'update-ui' to 'change', and when a 'change'
    // is emitted from a store, it simply attaches the relevant data.
    //
    // AssignmentStore: all assignments
    // NodeStore: the node that changed
    // TabStore: unknown
    // MapStore: the assignment and its nodes? TBD
    dispatch: function (actionName, payload) {
      var message = {
        type: actionName,
        payload: payload
      };

      chrome.runtime.sendMessage(message);
      info("Dispatched to UI", { message: message });
    }

  }
  
  return dispatcher.initialize();
};

module.exports = UIDispatcher;
