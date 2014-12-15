var info = require('debug')('background/proxy-change.js:info');

/**
 * This listens for 'change' events in the background, and sends them over
 * chrome.runtime to a listener in the UI
 */
var ProxyChange = function(flux, storeNames) {
  var dispatcher = {

    /**
     * Bind each store to a proxying function so that 'change' events can be
     * sent to the UI
     */
    initialize: function () {
      info('initialize proxy-change dispatcher')
      for (var i = 0; i < stores.length; i++) {

        var storeName = storeNames[i];
        var store = flux.store(storeName);
        store.on('change', function (payload) {
          info('Proxying change event', {payload: payload, this: this});
          this.proxy(storeName, payload);
        }.bind(this));
        info('Bound store: ' + storeName, { store: store });
      }
      info("Initialized ProxyChange", { stores: stores });
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
