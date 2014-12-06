var info = require('debug')('background/app.js:info');

var App = function(flux, store) {
  var app = {
    initialize: function () {
      //listen to [map] store
      this.store = flux.store(store);
      this.store.on('update-ui', this.dispatch);
    },

    dispatch: function (actionName, payload) {

      var message = {
        type: actionName,
        payload: payload
      };

      info('passing message to UI ', { message: message })
      //pass background thread data to UI
      chrome.runtime.sendMessage(message);
    }

  }
  
  return app.initialize();
};

module.exports = App;
