import _               from 'lodash';
import constants       from '../constants';
import messageChannel  from '../util/message-channel';

import Logger from '../util/logger';
var logger = Logger('background/proxy-change.js');

/**
 * This listens for 'change' events in the background, and sends them over
 * chrome.runtime to a listener in the UI
 */
export default function ProxyChange(flux, stores) {
  var dispatcher = {

    /**
     * Bind each store to a proxying function so that 'change' events can be
     * sent to the UI
     */
    initialize: function() {
      logger.info('initialize proxy-change dispatcher');
      _.each(stores, function (storeName) {
        flux.store(storeName).on('change', function (payload = {}) {
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
    proxy: function(storeName, payload) {
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
