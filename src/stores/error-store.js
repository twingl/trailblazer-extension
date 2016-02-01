import _         from 'lodash';
import constants from '../constants';
import Raven     from 'raven-js';

import Store from '../lib/store';

import globalConfig from '../config';
var config = globalConfig.raven;

import Logger from '../util/logger';
var logger = Logger('stores/error-store.js');

class ErrorStore extends Store {

  constructor (options = {}) {
    super(options);

    var actionHandlers = _.map([
      constants.FETCH_ASSIGNMENTS_FAIL,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL,
      constants.FETCH_NODES_FAIL,
      constants.UPDATE_NODE_CACHE_FAIL,
      constants.PERSIST_ASSIGNMENT_FAIL,
      constants.START_RECORDING_FAIL,
      constants.RESUME_RECORDING_FAIL
    ], (action) => {
      var reporter = (payload) => {
        this.report(action, payload);
      };

      return [action, reporter];
    });

    this.bindActions.apply(this, _.flatten(actionHandlers));
  }

  report (type, data) {
    data = data || {};

    data.manifest = chrome.runtime.getManifest();

    chrome.runtime.getPlatformInfo((platformInfo) => {
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
};

export default ErrorStore;
