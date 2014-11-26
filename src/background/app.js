var App = function(flux, store, actions) {
  var app = {
    initialize: function() {
      this.store = flux.store(store);
      this.store.on('change', this.dispatch);
    },

    dispatch: function() {
      console.log('this in app dispatch', this)
      var message = {
        type: 'change',
        payload: this.getState()
      };
      //pass background thread data to UI
      chrome.runtime.sendMessage(message);
    }
  }
  
  return app.initialize();
};

module.exports = App;
