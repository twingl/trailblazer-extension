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
      for (var i = 0; i < stores.length; i++) {
        info('Binding store: ' + stores[i]);
        var store = stores[i];
        flux.store(stores[i]).on('change', function (payload) {
          info('Proxying change event from ' + store, payload);
          this.proxy(store, payload);
        }.bind(this));
      }
      info("Initialized ProxyChange", { stores: stores });
    },

    /**
     * Dispatches a 'change' event over chrome.runtime messaging
     */
    proxy: function (store, payload) {
      var message = {
        action: 'change',
        store: store,
        payload: payload
      };

      chrome.runtime.sendMessage(message);
      info("Dispatched to UI", { message: message });
    }

  }
  
  return dispatcher.initialize();
};

module.exports = ProxyChange;
