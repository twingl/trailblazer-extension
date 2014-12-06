var info = require('debug')('background/app.js:info');

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
