//NOT USED YET!

var ChromeEventAdapter    = require('../adapter/chrome_event_adapter');
var StateManager          = require('./state-manager');
var _                     = require('lodash');
// var stateManager          = new StateManager();

//constants
var DEBOUNCE_MS = 700;

module.exports = {
  
  eventBuffer: [],

  eventAdapter: new ChromeEventAdapter,

  flushBuffer: _.debounce( function() {
    //Move the event buffer into a local variable (sorted by ID) and reset it
    //ready for the next flush
    //FIXME Making the assumption that parentTabId will reference an ID less
    //than its own tabId
    var buffer = _.sortBy(this.eventBuffer, function(d) { return d.data.tabId });
    this.eventBuffer.length = 0;

    // Iterate over the sorted buffer, finding and updating (or creating) the
    // node for each event
    _.each(buffer, function(evt) {
      switch (evt.type) {
        case "created_tab":
          stateManager.createdTab(evt);
          break;
        case "updated_tab":
          stateManager.updatedTab(evt);
          break;
        case "switched_tab":
          stateManager.switchedTab(evt);
          break;
        case "closed_tab":
          stateManager.closedTab(evt);
          break;
        case "resumed_node":
          stateManager.resumedNode(evt);
          break;
        case "redirect_pending":
          stateManager.redirectPending(evt);
          break;
      }
    });

  }, DEBOUNCE_MS ),

  bindEvent: function(name) {
    this.eventAdapter[name].addListener( function(tabEvent) {
      this.eventBuffer.push(tabEvent);
      this.flushBuffer();
    }.bind(this));
  }
}
