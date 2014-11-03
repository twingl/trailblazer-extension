// models
var Node                  = require('../model/node')
  , Assignment            = require('../model/assignment');

// adapters
var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , ChromeEventAdapter    = require('../adapter/chrome_event_adapter')
  , tabIdMap              = require('./tab-id-map');

var extensionStates       = require('./extension-states');

//actions
var getNode               = require('../lib/get-node');
var startRecording        = require('../lib/start-recording');
var getCurrentNode        = require('../lib/get-current-node');
var createdTab            = require('../lib/created-tab');
var updatedTab            = require('../lib/updated-tab');
var switchedTab           = require('../lib/switched-tab');
var closedTab             = require('../lib/closed-tab');
var resumedNode           = require('../lib/resumed-node');
var redirectPending       = require('../lib/redirect-pending');

//events 
// var Fluxxor               = require('fluxxor');
// var eventManager          = require('./event-manager');

//helpers
var _                     = require('lodash')
  , Promise               = require('promise')

//constants
var DEBOUNCE_MS = 700;

var StateManager = function() {

  /**
   * @property {EventAdapter} _eventAdapter - The instance of the
   * EventAdapter being used to receive events
   * @private
   */
  this._eventAdapter = new ChromeEventAdapter();

  /**
   * @property {IdentityAdapter} _identityAdapter - The instance of the
   * IdentityAdapter being used for authentication
   * @private
   */
  this._identityAdapter = new ChromeIdentityAdapter();

  /**
   * @property {Array} _eventBuffer - Buffer into which events are pushed
   * from the event adapter. Periodically cleared and processed into nodes.
   * @private
   */
  this._eventBuffer = [];

  // Register StateManager's event handlers with the EventAdapter
  this._bindEvent("onCreatedTab");
  this._bindEvent("onUpdatedTab");
  this._bindEvent("onSwitchedTab");
  this._bindEvent("onClosedTab");
  this._bindEvent("onBeforeRedirect");

  // Indicate to the EventAdapter that we're ready to start listening for
  // events. Pass in `true` so that we get the initial browser state.
  this._eventAdapter.ready(true);
};

/**
 * Resume recording a trail on a given node and tab.
 *
 * Inserts an event in the buffer to be handled by {@link
 * StateManager#resumedNode()}
 *
 * @function StateManager#resumeRecording
 * @param {number} tabId - The ID of the Tab to use
 * @param {number} nodeId - The ID of the Node to navigate to
 */
StateManager.prototype.resumeRecording = function(tabId, nodeId) {
  var tabEvent = {
    type: "resumed_node",
    occurred: Date.now(),
    data: {
      tabId: tabId,
      nodeId: nodeId
    }
  };
  this._eventBuffer.push(tabEvent);
  this._flushBuffer();
};

/**
 * Flushes the StateManager's event buffer and processes it, inserting new
 * nodes and updating as necessary.
 * De-bounced.
 * @TODO Re-evaluate whether buffering these events is necessary
 *
 * @function StateManager#_flushBuffer
 * @private
 */
StateManager.prototype._flushBuffer = _.debounce( function() {
  //Move the event buffer into a local variable (sorted by ID) and reset it
  //ready for the next flush
  //FIXME Making the assumption that parentTabId will reference an ID less
  //than its own tabId
  var buffer = _.sortBy(this._eventBuffer, function(d) { return d.data.tabId });
  this._eventBuffer.length = 0;

  // Iterate over the sorted buffer, finding and updating (or creating) the
  // node for each event
  _.each(buffer, function(evt) {
    switch (evt.type) {
      case "created_tab":
        createdTab(evt);
        break;
      case "updated_tab":
        updatedTab(evt);
        break;
      case "switched_tab":
        switchedTab(evt);
        break;
      case "closed_tab":
        closedTab(evt);
        break;
      case "resumed_node":
        resumedNode(evt);
        break;
      case "redirect_pending":
        redirectPending(evt);
        break;
    }
  }.bind(this));

}, DEBOUNCE_MS );

/**
 * Binds an event to a default handler that pushes the event into a buffer,
 * then calls a de-bounced function to flush the buffer.
 *
 * @function StateManager#_bindEvent
 * @param {string} name - The name of the event to be bound to the default
 * (buffered) handler
 * @private
 */

StateManager.prototype._bindEvent = function(name) {
  this._eventAdapter[name].addListener( function(tabEvent) {
    this._eventBuffer.push(tabEvent);
    this._flushBuffer();
  }.bind(this));
};

module.exports = StateManager;

/**
 * @TODO Get info about the specified tab, including its recording state, which
 * Node it corresponds to and which Project it belongs to (if applicable).
 *
 * ```javascript
 * {
 *   recording: true,
 *   assignmentId: 4,
 *   nodeId: 82
 * }
 * ```
 *
 * @function StateManager#getTabInfo
 * @param {number} tabId - The ID of the Tab to get information about
 * @returns {Object}
 */
// StateManager.prototype.getTabInfo = function(tabId) {};
