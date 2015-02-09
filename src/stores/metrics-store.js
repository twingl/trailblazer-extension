var _         = require('lodash')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor')
  , config    = require('../config').keen
  , KeenIO    = require('keen.io')
  , uuid      = require('node-uuid');

var debug = require('debug')
  , info  = debug('stores/metrics-store.js:info')
  , warn  = debug('stores/metrics-store.js:warn')
  , error = debug('stores/metrics-store.js:error');

var MetricsStore = Fluxxor.createStore({

  initialize: function (options) {
    this.uuid = {};
    this.db = options.db;

    this.bindActions(
      constants.SIGN_IN, this.handleSignIn,
      constants.SIGN_IN_SUCCESS, this.handleSignInSuccess,
      constants.SIGN_OUT, this.handleSignOut,
      constants.START_RECORDING, this.handleStartRecording,
      constants.START_RECORDING_SUCCESS, this.handleStartRecordingSuccess,
      constants.STOP_RECORDING, this.handleStopRecording,
      constants.VIEWED_ASSIGNMENT_LIST, this.handleViewedAssignmentList,
      constants.VIEWED_MAP, this.handleViewedMap,
      constants.RESUME_RECORDING, this.handleResumeRecording,
      constants.RANK_NODE_WAYPOINT, this.handleRankNodeWaypoint,
      constants.RANK_NODE_NEUTRAL, this.handleRankNodeNeutral,
      constants.MAKE_ASSIGNMENT_VISIBLE, this.handleMakeAssignmentVisible,
      constants.MAKE_ASSIGNMENT_HIDDEN, this.handleMakeAssignmentHidden,

      constants.EXTENSION_INSTALLED, this.handleExtensionInstalled,
      constants.EXTENSION_UPDATED, this.handleExtensionUpdated,
      constants.CHROME_UPDATED, this.handleChromeUpdated
    );

    var initStoreUUID = function(storageType) {
      chrome.storage[storageType].get("uuid", function(res) {
        if (res.uuid) {
          this.uuid[storageType] = res.uuid;
        } else {
          this.uuid[storageType] = uuid.v4();
          chrome.storage[storageType].set({ uuid: this.uuid[storageType] });
        }
      }.bind(this));
    }.bind(this);

    initStoreUUID("sync");
    initStoreUUID("local");

    this.initUserInfo = function(cb) {
      chrome.storage.sync.get(function(res) {
        if (res.token) {
          this.identity = JSON.parse(res.token);
        } else {
          this.identity = {};
        }
        if (cb) cb();
      }.bind(this));
    }.bind(this);

    this.initUserInfo();

    if (config.enabled === "true") {
      this.keen = KeenIO.configure({
        projectId: config.projectId,
        writeKey: config.writeKey
      });
    } else {
      this.keen = {
        // Just execute the callback straight away - we're not tracking anything
        addEvent: function(collection, properties, cb) { cb(); }
      }
    }

    this.reportEvent = function(collection, properties) {
      properties = properties || {};

      properties.uuid = properties.uuid || {};

      if (this.uuid.sync)  properties.uuid.sync  = this.uuid.sync;
      if (this.uuid.local) properties.uuid.local = this.uuid.local;

      chrome.runtime.getPlatformInfo(function(platformInfo) {
        var manifest = chrome.runtime.getManifest();

        properties.extension = properties.extension || {};

        properties.extension.name = manifest.name;
        properties.extension.version = manifest.version;
        properties.extension.platform = platformInfo;

        info("Reporting event to " + collection, {
          collection: collection,
          properties: properties
        });

        this.keen.addEvent(collection, properties, function(err, res) {
          if (err) {
            error("Failed to report event to keen:", { error: err });
          }
        });
      }.bind(this));
    };
  },

  /**
   * Main funnel
   */
  handleSignIn: function() {
    var collection = "extension.sign_in";
    var properties = {};

    this.reportEvent(collection, properties);
  },

  handleSignInSuccess: function() {
    var collection = "extension.sign_in_success";
    var properties = {};

    this.initUserInfo(function() {
      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleStartRecording: function (payload) {
    var collection = "extension.start_recording";
    var properties = {};

    this.reportEvent(collection, properties);
  },

  handleStartRecordingSuccess: function (payload) {
    var collection = "extension.start_recording_success";
    var properties = {};

    this.db.nodes.index("tabId").get(payload.tabId).then(function(nodes) {
      var node = _.first(nodes);

      if (node) {
        properties.assignment = {
          id:      node.assignmentId,
          localId: node.localAssignmentId,
        };
        properties.node = {
          id:      node.id,
          localId: node.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleViewedAssignmentList: function (payload) {
    var collection = "extension.viewed_assignment_list";
    var properties = {};

    this.reportEvent(collection, properties);
  },

  handleViewedMap: function (payload) {
    var collection = "extension.viewed_map";
    var properties = {};

    this.db.assignments.get(payload.localId).then(function(assignment) {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleResumeRecording: function (payload) {
    var collection = "extension.resume_recording";
    var properties = {};


    this.db.nodes.get(payload.localId).then(function(node) {
      if (node) {
        properties.assignment = {
          id:      node.assignmentId,
          localId: node.localAssignmentId,
        };
        properties.node = {
          id:      node.id,
          localId: node.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  /**
   * Additional actions
   */
  handleSignOut: function() {
    var collection = "extension.sign_out";
    var properties = {};

    this.identity = {};

    this.reportEvent(collection, properties);
  },

  handleStopRecording: function (payload) {
    var collection = "extension.stop_recording";
    var properties = {};

    this.db.nodes.index("tabId").get(payload.tabId).then(function(nodes) {
      var node = _.first(nodes);

      if (node) {
        properties.assignment = {
          id:      node.assignmentId,
          localId: node.localAssignmentId,
        };
        properties.node = {
          id:      node.id,
          localId: node.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleRankNodeWaypoint: function (payload) {
    var collection = "extension.rank_node_waypoint";
    var properties = {};

    this.db.nodes.get(payload.localId).then(function(node) {
      if (node) {
        properties.assignment = {
          id:      node.assignmentId,
          localId: node.localAssignmentId,
        };
        properties.node = {
          id:      node.id,
          localId: node.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleRankNodeNeutral: function (payload) {
    var collection = "extension.rank_node_neutral";
    var properties = {};

    this.db.nodes.get(payload.localId).then(function(node) {
      if (node) {
        properties.assignment = {
          id:      node.assignmentId,
          localId: node.localAssignmentId,
        };
        properties.node = {
          id:      node.id,
          localId: node.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleMakeAssignmentVisible: function (payload) {
    var collection = "extension.make_assignment_visible";
    var properties = {};

    this.db.assignments.get(payload.localId).then(function(assignment) {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleMakeAssignmentHidden: function (payload) {
    var collection = "extension.make_assignment_hidden";
    var properties = {};

    this.db.assignments.get(payload.localId).then(function(assignment) {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    }.bind(this));
  },

  handleExtensionInstalled: function () {
    var collection = "extension.installed";
    var properties = {};

    this.reportEvent(collection, properties);
  },

  handleExtensionUpdated: function (payload) {
    var collection = "extension.updated";
    var properties = {
      extension: {
        oldVersion: payload.oldVersion
      }
    };

    this.reportEvent(collection, properties);
  },

  handleChromeUpdated: function () {
    var collection = "extension.chrome_updated";
    var properties = {};

    this.reportEvent(collection, properties);
  }
});

module.exports = MetricsStore;
