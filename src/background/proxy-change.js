var info = require('debug')('background/proxy-change.js:info');

/**
 * This listens for 'change' events in the background, and sends them over
 * chrome.runtime to a listener in the UI
 */
var ProxyChange = function(flux, stores) {
  var dispatcher = {

    /**
     * Bind each store to a proxying function so that 'change' events can be
     * sent to the UI
     */
    initialize: function () {
      info('initialize proxy-change dispatcher')
      for (var i = 0; i < stores.length; i++) {

        var storeName = stores[i];

        flux.store(storeName).on('change', function (payload) {
          info('Proxying change event from ' + storeName, { payload: payload });
          this.proxy(storeName, payload);
        }.bind(this));

        info('Bound proxy for ' + storeName);
      }
      info("Initialized ProxyChange: " + stores.join(", "); });
    },

    /**
     * Dispatches a 'change' event over chrome.runtime messaging
     */
    proxy: function (storeName, payload) {
      var message = {
        action: 'change',
        storeName: storeName,
        payload: payload
      };
      chrome.runtime.sendMessage(message);
      info("Dispatched to UI", { message: message });
    }

  }

  return dispatcher.initialize();
};

module.exports = ProxyChange;
