import _         from 'lodash';
import constants from '../constants';
import Store     from '../lib/store';
import KeenIO    from 'keen.io';
import uuid      from 'node-uuid';

import { action } from '../decorators';

import globalConfig from '../config';
var config = globalConfig.keen;

import Logger from '../util/logger';
var logger = Logger('stores/metrics-store.js')

class MetricsStore extends Store {

  constructor (options = {}) {
    super(options);

    this.uuid = {};
    this.db = options.db;

    var initStoreUUID = (storageType) => {
      chrome.storage[storageType].get("uuid", (res) => {
        if (res.uuid) {
          this.uuid[storageType] = res.uuid;
        } else {
          this.uuid[storageType] = uuid.v4();
          chrome.storage[storageType].set({ uuid: this.uuid[storageType] });
        }
      });
    };

    initStoreUUID("sync");
    initStoreUUID("local");

    this.initUserInfo = (cb) => {
      chrome.storage.sync.get((res) => {
        if (res.token) {
          this.identity = JSON.parse(res.token);
        } else {
          this.identity = {};
        }
        if (cb) cb();
      });
    };

    this.initUserInfo();

    if (config.enabled === "true") {
      this.keen = KeenIO.configure({
        projectId: config.projectId,
        writeKey: config.writeKey
      });
    } else {
      this.keen = {
        // Just execute the callback straight away - we're not tracking anything
        addEvent: (collection, properties, cb) => { cb(); }
      }
    }

    this.reportEvent = (collection, properties) => {
      properties = properties || {};

      properties.uuid = properties.uuid || {};

      if (this.uuid.sync)  properties.uuid.sync  = this.uuid.sync;
      if (this.uuid.local) properties.uuid.local = this.uuid.local;

      chrome.runtime.getPlatformInfo((platformInfo) => {
        var manifest = chrome.runtime.getManifest();

        properties.extension = properties.extension || {};

        properties.extension.name = manifest.name;
        properties.extension.version = manifest.version;
        properties.extension.platform = platformInfo;

        logger.info("Reporting event to " + collection, {
          collection: collection,
          properties: properties
        });

        this.keen.addEvent(collection, properties, (err, res) => {
          if (err) {
            logger.error("Failed to report event to keen:", { error: err });
          }
        });
      });
    };
  }

  /**
   * Main funnel
   */
  @action(constants.SIGN_IN)
  handleSignIn(payload) {
    var collection = "extension.sign_in";
    var properties = {};

    this.reportEvent(collection, properties);
  }

  @action(constants.SIGN_IN_SUCCESS)
  handleSignInSuccess(payload) {
    var collection = "extension.sign_in_success";
    var properties = {};

    this.initUserInfo(() => {
      this.reportEvent(collection, properties);
    });
  }

  @action(constants.START_RECORDING)
  handleStartRecording(payload) {
    var collection = "extension.start_recording";
    var properties = {};

    this.reportEvent(collection, properties);
  }

  @action(constants.START_RECORDING_SUCCESS)
  handleStartRecordingSuccess(payload) {
    var collection = "extension.start_recording_success";
    var properties = {};

    this.db.nodes.index("tabId").get(payload.tabId).then((nodes) => {
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
    });
  }

  @action(constants.VIEWED_ASSIGNMENT_LIST)
  handleViewedAssignmentList(payload) {
    var collection = "extension.viewed_assignment_list";
    var properties = {};

    this.reportEvent(collection, properties);
  }

  @action(constants.VIEWED_MAP)
  handleViewedMap(payload) {
    var collection = "extension.viewed_map";
    var properties = {};

    this.db.assignments.get(payload.localId).then((assignment) => {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    });
  }

  @action(constants.RESUME_RECORDING)
  handleResumeRecording(payload) {
    var collection = "extension.resume_recording";
    var properties = {};


    this.db.nodes.get(payload.localId).then((node) => {
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
    });
  }

  /**
   * Additional actions
   */
  @action(constants.SIGN_OUT)
  handleSignOut(payload) {
    var collection = "extension.sign_out";
    var properties = {};

    this.identity = {};

    this.reportEvent(collection, properties);
  }

  @action(constants.STOP_RECORDING)
  handleStopRecording(payload) {
    var collection = "extension.stop_recording";
    var properties = {};

    this.db.nodes.index("tabId").get(payload.tabId).then((nodes) => {
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
    });
  }

  @action(constants.RANK_NODE_FAVOURITE)
  handleRankNodeFavourite(payload) {
    var collection = "extension.rank_node_favourite";
    var properties = {};

    this.db.nodes.get(payload.localId).then((node) => {
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
    });
  }

  @action(constants.RANK_NODE_NEUTRAL)
  handleRankNodeNeutral(payload) {
    var collection = "extension.rank_node_neutral";
    var properties = {};

    this.db.nodes.get(payload.localId).then((node) => {
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
    });
  }

  @action(constants.MAKE_ASSIGNMENT_VISIBLE)
  handleMakeAssignmentVisible(payload) {
    var collection = "extension.make_assignment_visible";
    var properties = {};

    this.db.assignments.get(payload.localId).then((assignment) => {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    });
  }

  @action(constants.MAKE_ASSIGNMENT_HIDDEN)
  handleMakeAssignmentHidden(payload) {
    var collection = "extension.make_assignment_hidden";
    var properties = {};

    this.db.assignments.get(payload.localId).then((assignment) => {
      if (assignment) {
        properties.assignment = {
          id:      assignment.id,
          localId: assignment.localId
        };
      }

      this.reportEvent(collection, properties);
    });
  }

  @action(constants.COMPLETED_ONBOARDING_STEP)
  handleCompletedOnboardingStep(payload) {
    var collection = "extension.completed_onboarding_step";
    var properties = {
      step: payload.step
    };

    this.reportEvent(collection, properties);
  }

  @action(constants.EXTENSION_INSTALLED)
  handleExtensionInstalled() {
    var collection = "extension.installed";
    var properties = {};

    this.reportEvent(collection, properties);
  }

  @action(constants.EXTENSION_UPDATED)
  handleExtensionUpdated(payload) {
    var collection = "extension.updated";
    var properties = {
      extension: {
        oldVersion: payload.oldVersion
      }
    };

    this.reportEvent(collection, properties);
  }

  @action(constants.CHROME_UPDATED)
  handleChromeUpdated() {
    var collection = "extension.chrome_updated";
    var properties = {};

    this.reportEvent(collection, properties);
  }
};

export default MetricsStore;
