var constants = require('./constants');
var info = require('debug')('actions.js:info');

module.exports = {

  fetchAssignments: function () {
    info('fetchAssignments');
    this.dispatch(constants.FETCH_ASSIGNMENTS);
  },

  fetchAssignmentsSuccess: function (assignments) {
    info('fetchAssignmentsSuccess');
    this.dispatch(constants.FETCH_ASSIGNMENTS_SUCCESS, { assignments: assignments });
  },

  fetchAssignmentsFail: function (error) {
    info('fetchAssignmentsFail');
    this.dispatch(constants.FETCH_ASSIGNMENTS_FAIL, { error: error });
  },

  updateAssignmentCache: function (assignments) {
    info('updateAssignmentCache');
    this.dispatch(constants.UPDATE_ASSIGNMENT_CACHE, { assignments: assignments });
  },

  updateAssignmentCacheSuccess: function () {
    info('updateAssignmentCacheSuccess');
    this.dispatch(constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS);
  },

  updateAssignmentCacheFail: function (error) {
    info('updateAssignmentCacheFail');
    this.dispatch(constants.UPDATE_ASSIGNMENT_CACHE_FAIL, { error: error });
  },

  assignmentsSynchronized: function (assignments) {
    info('assignmentsSynchronized');
    this.dispatch(constants.ASSIGNMENTS_SYNCHRONIZED, { assignments: assignments });
  },

  loadNodes: function (assignmentId) {
    info('loadNodes');
    this.dispatch(constants.LOAD_NODES, {assignmentId: assignmentId});
  },

  loadNodesSuccess: function (nodes) {
    info('loadNodesSuccess');
    this.dispatch(constants.LOAD_NODES_SUCCESS, { nodes: nodes });
  },

  //UI ACTIONS. Dispatch is overwritten in UI and passes a message through runtime
  //which then calls the *same* method in background. [Mind Blown]
  selectAssignment: function (assignmentId) {
    info('selectAssignment');
    this.dispatch(constants.SELECT_ASSIGNMENT, { assignmentId: assignmentId });
  }
}
