var App = function(flux, store, actions) {
  var app = {
    initialize: function () {
      //listen to [map] store
      this.store = flux.store(store);
      this.store.on('change', this.dispatch);
    },

    dispatch: function (actionName, payload) {
      var message = {
        type: actionName,
        payload: payload
      };
      //pass background thread data to UI
      chrome.runtime.sendMessage(message);
    }

  }
  
  return app.initialize();
};

module.exports = App;
