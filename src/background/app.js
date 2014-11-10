var App = function(flux, store, actions) {
  var connectedTabs = {};
  var app = {
    initialize: function() {
      this.store = flux.store(store);
      this.store.on('change', this.dispatch);

      chrome.runtime.onConnect.addListener(function(port) {
        var id = port.sender.tab.id;
        connectedTabs[id] = port;

        port.onMessage.addListener(function(msg) {
          flux.dispatcher.dispatch(msg);
        });

        port.onDisconnect.addListener(function(port) {
          if (connectedTabs[id]) delete connectedTabs[id];
        });

      });
    },

    dispatch: function() {
      for (var port in connectedTabs) {
        if (connectedTabs.hasOwnProperty(port)) {
          connectedTabs[port].postMessage(this.getState());
        }
      }
    }

  }

  return app.initialize();
};

module.exports = App;
