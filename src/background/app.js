var App = function(flux, stores, actions) {
  var connectedTabs = {};
  var app = {
    initialize: function() {
       for (var i=0;i<stores.length;i++) {
        var store = stores[i];
        this[store] = flux.store(store);
        this.store.on('change', this.dispatch);
       }

      //TODO make a big state object that looks like:
  //   return {
  //     assignmentId: null,
  //     mode: 'ASSIGNMENTS',
  //     nodeState: {
  //       loading: false,
  //       error: null,
  //       nodeMap: NodeStore.getState().nodeMap
  //     },
  //     AssignmentState: {
  //       loading: AssignmentStore.loading,
  //       error: AssignmentStore.error,
  //       assignmentMap: AssignmentStore.getState().assignmentMap
  //     }
  //   };


      this.singleSourceOfState = undefined;

    },

    dispatch: function() {
      console.log('this in app dispatch', this)
      var state;
      var storeState = this.getState();



      chrome.runtime.sendMessage(state);
    }

  }

  return app.initialize();
};

module.exports = App;
