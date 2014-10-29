// helpers
var _          = require('lodash');

module.exports = ChromeEventAdapter;

/**
 * Creates a new ChromeEventAdapter
 *
 * @class ChromeEventAdapter
 * @classdesc
 * Listens to events emitted by Chrome's extension API and translates them
 * into the format used by the extension. When an event is fired, an instance
 * of this class will iterate over the registered listeners for that event,
 * calling each with the translated event data.
 */
var ChromeEventAdapter = function() {
  /**
   * @property {boolean} _ready - The ready state of the adapter. When the
   * application is ready to receive events from this adapter, ready() is
   * called setting this to true.
   * @private
   */
  this._ready = false;

  /**
   * @property {Object} _listeners - The registered listeners for each event type
   * @property {Array} _listeners.<name> - declared using _declareEvent(name)
   * @private
   */
  this._listeners = {};

  /**
   * @typedef {Object} ChromeEventAdapter.TabEvent
   * @property {string} type - Declares the event type
   * @property {number} occurred - Timestamp indicating when the event was fired
   * @property {Object} data - Event data (documented with each event)
   */

  /**
   * Fired when a tab in any window is created. Handlers receive a single
   * argument {@link ChromeEventAdapter.TabEvent} which will look something
   * like:
   *
   * ```javascript
   * {
   *   type: "created_tab",
   *   occurred: Date.now(),
   *   data: {
   *     tabId: tab.id,
   *     parentTabId: tab.openerTabId,
   *     url: tab.url,
   *     title: tab.title
   *   }
   * }
   * ```
   *
   * @event ChromeEventAdapter#onCreatedTab
   */
  this._declareEvent("onCreatedTab");

  /**
   * Fired when a tab in any window is updated. Handlers receive a single
   * argument {@link ChromeEventAdapter.TabEvent} which will look something
   * like:
   *
   * ```javascript
   * {
   *   type: "updated_tab",
   *   occurred: Date.now(),
   *   data: {
   *     tabId: tab.id,
   *     url: tab.url,
   *     title: tab.title
   *   }
   * }
   * ```
   *
   * @event ChromeEventAdapter#onUpdatedTab
   */
  this._declareEvent("onUpdatedTab");

  /**
   * Fired when the focused tab changes; i.e. a person switches tabs.
   * Handlers receive a single argument {@link ChromeEventAdapter.TabEvent}
   * which will look something like:
   *
   * ```javascript
   * {
   *   type: "switched_tab",
   *   occurred: Date.now(),
   *   data: {
   *     tabId: tab.id
   *   }
   * }
   * ```
   *
   * @event ChromeEventAdapter#onSwitchedTab
   */
  this._declareEvent("onSwitchedTab");

  /**
   * Fired when a tab in any window is closed. Handlers receive a single
   * argument {@link ChromeEventAdapter.TabEvent} which will look something
   * like:
   *
   * ```javascript
   * {
   *   type: "closed_tab",
   *   occurred: Date.now(),
   *   data: {
   *     tabId: tab.id
   *   }
   * }
   * ```
   *
   * @event ChromeEventAdapter#onClosedTab
   */
  this._declareEvent("onClosedTab");

  /**
   * Fired when a tab  is about to redirect. Handlers receive a single
   * argument {@link ChromeEventAdapter.TabEvent} which will look something
   * like:
   *
   * ```javascript
   * {
   *   type: "redirect_pending",
   *   occurred: Date.now(),
   *   data: {
   *     tabId: tab.id,
         url: details.url,
         redirectUrl: details.redirectUrl
   *   }
   * }
   * ```
   *
   * @event ChromeEventAdapter#onBeforeRedirect
   */
  this._declareEvent("onBeforeRedirect");

  this._registerHandlers(this);
};

/**
 * Indicates to the adapter that the application is ready to start receiving
 * events. Calling this function will allow events through to their handlers
 * as well as firing `created_tab` events for all existing tabs to set
 * initial state if `true` is passed.
 *
 * Will not execute, but log a warning message if called more than once.
 *
 * @function ChromeEventAdapter#ready
 * @param {boolean} fireCreate - fire `created_tab` for existing tabs
 */
ChromeEventAdapter.prototype.ready = function(fireCreate) {
  if (this._ready !== true) {
    // Set the ready state for the adapter
    this._ready = true;

    // Fire the `created_tab` event for all existing tabs and the
    // `switched_tab` for the current tab if fireCreate is true
    if (fireCreate === true) {
      chrome.tabs.query({ windowType: "normal" }, function(tabs) {
        // Emit 'created' for all tabs
        _.each(tabs, this._onCreatedTab.bind(this));

        // Emit 'switched' for current tab
        chrome.windows.getLastFocused({ populate: true }, function(win) {
          if (win.type === "normal") {
            var tab = _.findWhere(win.tabs, { active: true });
            this._onSwitchedTab({ windowId: win.id, tabId: tab.id });
          }
        }.bind(this));
      }.bind(this));
    }
  } else {
    console.log("[W] ChromeEventAdapter.ready() called multiple times. Skipping.")
  }
};

/**
 * Declares an event on ChromeEventAdapter that is able to have callbacks
 * registered against it.
 *
 * Creates an object `name` on the EventAdapter, containing a function
 * `addListener` which accepts a single argument `listener`. When called,
 * `listener` is pushed into the array of listeners.
 *
 * @function ChromeEventAdapter#_declareEvent
 * @param {string} name - Name of the event to declare
 * @private
 */
ChromeEventAdapter.prototype._declareEvent = function(name) {
  // Instantiate a new list for handlers if needed
  this._listeners[name] = this._listeners[name] || [];

  // Declare <eventName>.addListener()
  this[name] = {
    addListener: function(listener) {
      this._listeners[name].push(listener);
    }.bind(this)
  };
};

/**
 * Internal handler for `chrome.tabs.onCreated` event
 *
 * See {@link https://developer.chrome.com/extensions/tabs#event-onCreated}
 * for more information about the parameters
 *
 * @function ChromeEventAdapter#_onCreatedTab
 * @param {chrome.tabs.Tab} tab
 * @private
 */
ChromeEventAdapter.prototype._onCreatedTab = function(createdTab) {
  chrome.tabs.query({ windowType: "normal" }, function(tabs) {
    var tab = _.findWhere(tabs, { id: createdTab.id });
    if (tab) {
      var evt = {
        type: "created_tab",
        occurred: Date.now(),
        data: {
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
          parentTabId: tab.openerTabId
        }
      };
      if (this._ready) {
        _.each(this._listeners.onCreatedTab, function(l) { l(evt); });
      }
    }
  }.bind(this));
};

/**
 * Internal handler for `chrome.tabs.onUpdated` event
 *
 * See {@link https://developer.chrome.com/extensions/tabs#event-onUpdated}
 * for more information about the parameters
 *
 * @function ChromeEventAdapter#_onUpdatedTab
 * @param {number} tabId
 * @param {Object} changeInfo
 * @param {chrome.tabs.Tab} tab
 * @private
 */
ChromeEventAdapter.prototype._onUpdatedTab = function(tabId, changeInfo, updatedTab) {
  chrome.tabs.query({ windowType: "normal" }, function(tabs) {
    var tab = _.findWhere(tabs, { id: updatedTab.id });
    if (tab) {
      var evt = {
        type: "updated_tab",
        occurred: Date.now(),
        data: {
          tabId: tab.id,
          url: tab.url,
          title: tab.title
        }
      };
      if (this._ready) {
        _.each(this._listeners.onUpdatedTab, function(l) { l(evt); });
      }
    };
  }.bind(this));
};

/**
 * Internal handler for `chrome.tabs.onActivated` event
 *
 * See {@link https://developer.chrome.com/extensions/tabs#event-onActivated}
 * for more information about the parameters
 *
 * @function ChromeEventAdapter#_onSwitchedTab
 * @param {Object} activeInfo
 * @private
 */
ChromeEventAdapter.prototype._onSwitchedTab = function(activeInfo) {
  chrome.tabs.query({ windowType: "normal" }, function(tabs) {
    var tab = _.findWhere(tabs, { id: activeInfo.tabId });
    if (tab) {
      var evt = {
        type: "switched_tab",
        occurred: Date.now(),
        data: {
          tabId: tab.id
        }
      };
      if (this._ready) {
        _.each(this._listeners.onSwitchedTab, function(l) { l(evt); });
      }
    }
  }.bind(this));
};

/**
 * Internal handler for `chrome.tabs.onRemoved` event.
 *
 * See {@link https://developer.chrome.com/extensions/tabs#event-onRemoved}
 * for more information about the parameters
 *
 * @function ChromeEventAdapter#_onClosedTab
 * @param {number} tabId
 * @param {Object} removeInfo
 * @private
 */
ChromeEventAdapter.prototype._onClosedTab = function(tabId, removeInfo) {
  var evt = {
    type: "closed_tab",
    occurred: Date.now(),
    data: {
      tabId: tabId
    }
  };
  if (this._ready) {
    _.each(this._listeners.onClosedTab, function(l) { l(evt); });
  }
};

ChromeEventAdapter.prototype._onBeforeRedirect = function(details) {
  var evt = {
    type: "redirect_pending",
    occurred: Date.now(),
    data: {
      tabId: details.tabId,
      url: details.url,
      redirectUrl: details.redirectUrl
    }
  };
  if (this._ready) {
    _.each(this._listeners.onBeforeRedirect, function(l) { l(evt); });
  }
};

/**
 * Registers the internal handlers (declared above) for events emitted by the
 * Chrome API
 *
 * @function ChromeEventAdapter#_registerHandlers
 * @param {context} ctx - The context to bind handler functions to (i.e. what
 * `this` will be inside these functions)
 * @private
 */
ChromeEventAdapter.prototype._registerHandlers = function(ctx) {
  chrome.tabs.onCreated             .addListener( ctx._onCreatedTab     .bind(this) );
  chrome.tabs.onUpdated             .addListener( ctx._onUpdatedTab     .bind(this) );
  chrome.tabs.onActivated           .addListener( ctx._onSwitchedTab    .bind(this) );
  chrome.tabs.onRemoved             .addListener( ctx._onClosedTab      .bind(this) );
  chrome.webRequest.onBeforeRedirect.addListener( 
      ctx._onBeforeRedirect.bind(this), 
      {urls: ["<all_urls>"], types:["main_frame"]} 
  );
};
