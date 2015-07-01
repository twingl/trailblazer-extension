var _         = require('lodash')
  , config    = require('../config').raven
  , Fluxxor   = require('fluxxor')
  , constants = require('../constants')
  , info      = require('debug')('stores/error-store.js:info')
  , warn      = require('debug')('stores/error-store.js:warn')
  , error     = require('debug')('stores/error-store.js:error')
  , Raven     = require('raven-js');

var ErrorStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize', { options: options });
    var options = options || {};

    var actionHandlers = _.map([
      constants.FETCH_ASSIGNMENTS_FAIL,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL,
      constants.FETCH_NODES_FAIL,
      constants.UPDATE_NODE_CACHE_FAIL,
      constants.PERSIST_ASSIGNMENT_FAIL,
      constants.START_RECORDING_FAIL,
      constants.RESUME_RECORDING_FAIL
    ], function(action) {
      var reporter = function(payload) {
        this.report(action, payload);
      }.bind(this);

      return [action, reporter];
    }.bind(this));

    this.bindActions.apply(this, _.flatten(actionHandlers));
  },

  report: function (type, data) {
    data = data || {};

    data.manifest = chrome.runtime.getManifest();

    chrome.runtime.getPlatformInfo(function(platformInfo) {
      data.platformInfo = platformInfo;

      Raven.captureMessage("Action Failed: " + type, {
        tags: {
          type: type,
          extensionVersion: data.manifest.version
        },
        extra: data
      });
    });
  }
});

module.exports = ErrorStore;
