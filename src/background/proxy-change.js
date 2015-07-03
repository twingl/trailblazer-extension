var _               = require('lodash')
  , Logger          = require('../util/logger')
  , constants       = require('../constants')
  , messageChannel  = require('../util/message-channel');

var logger = new Logger('background/proxy-change.js');

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
      logger.info('initialize proxy-change dispatcher');
      _.each(stores, function (storeName) {
        flux.store(storeName).on('change', function (payload) {
          payload.store = payload.store || {};

          payload.store = storeName;
          logger.info('Proxying change event from ' + storeName, { payload: payload });
          this.proxy(storeName, payload);
        }.bind(this));

        logger.info('Bound proxy for ' + storeName);
      }.bind(this));
      logger.info("Initialized ProxyChange: " + stores.join(", "));
    },

    /**
     * Dispatches a 'change' event over chrome.runtime messaging
     */
    proxy: function (storeName, payload) {
      var message = {
        action: constants.__change__,
        storeName: storeName,
        payload: payload
      };
      messageChannel.send(message);
      logger.info("Dispatched to UI", { message: message });
    }

  }

  return dispatcher.initialize();
};

module.exports = ProxyChange;
