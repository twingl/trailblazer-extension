var _         = require('lodash')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor')
  , config    = require('../config').keen;

var debug = require('debug')
  , info  = debug('stores/metrics-store.js:info')
  , warn  = debug('stores/metrics-store.js:warn');

var MetricsStore = Fluxxor.createStore({

  initialize: function (options) {
    this.bindActions(
      constants.SIGN_IN, this.handleSignIn,
      constants.SIGN_IN_SUCCESS, this.handleSignInSuccess,
      constants.SIGN_OUT, this.handleSignOut,
      constants.START_RECORDING, this.handleStartRecording,
      constants.VIEWED_ASSIGNMENT_LIST, this.handleViewedAssignmentList,
      constants.VIEWED_MAP, this.handleViewedMap,
      constants.RESUME_RECORDING, this.handleResumeRecording,
      constants.RANK_NODE_WAYPOINT, this.handleRankNodeWaypoint,
      constants.MAKE_ASSIGNMENT_VISIBLE, this.handleMakeAssignmentVisible
    );
  },

  /**
   * Main funnel
   */
  handleSignIn: function() {
  },
  handleSignInSuccess: function() {
  },
  handleStartRecording: function (payload) {
  },
  handleViewedAssignmentList: function (payload) {
  },
  handleViewedMap: function (payload) {
  },
  handleResumeRecording: function (payload) {
  },

  /**
   * Additional actions
   */
  handleSignOut: function() {
  },
  handleRankNodeWaypoint: function (payload) {
  },
  handleMakeAssignmentVisible: function (payload) {
  }
});

module.exports = MetricsStore;
