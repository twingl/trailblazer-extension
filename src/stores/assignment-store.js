var _                             = require('lodash')
  , constants                     = require('../constants')
  , TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
  , Logger                        = require('../util/logger');

import Store from '../lib/store';
import { query, action } from '../decorators';

var logger = new Logger('stores/assignment-store.js');

class AssignmentStore extends Store {

  constructor (options = {}) {
    super(options);

    this.db                 = options.db;
  }

  @query
  async getAssignments () {
    var assignments = await this.db.assignments.all();
    return assignments;
  }

  @query
  async getAssignmentByLocalId (localId) {
    var assignment = await this.db.assignments.get(localId);
    return assignment;
  }

  @query
  async getAssignmentByRemoteId (remoteId) {
    var assignment = await this.db.assignments.index('id').get(remoteId);
    return assignment;
  }

  @action(constants.SIGN_OUT)
  handleSignOut () {
    this.db.assignments.clear();
  }

  /**
   * Emit all assignment data
   */
  @action(constants.REQUEST_ASSIGNMENTS)
  handleRequestAssignments () {
    logger.warn("DEPRECATED");
    // Get the assignments from the DB, fire a change, and fire a fetch assignments
    this.db.assignments.all().then(function(assignments) {
      this.emit('change', { assignments: assignments });
      this.flux.actions.fetchAssignments();
    }.bind(this));
  }

  /**
   * Emit all assignment data
   */
  @action(constants.CREATE_ASSIGNMENT_SUCCESS)
  handleCreateAssignmentSuccess () {
    this.db.assignments.all().then( function (assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  }

  /**
   * Updates an assignment record with a new title
   */
  @action(constants.UPDATE_ASSIGNMENT_TITLE)
  handleUpdateAssignmentTitle (payload) {
    logger.info('handleUpdateAssignmentTitle', { payload: payload });
    this.db.assignments.db.transaction("readwrite", ["assignments"], function(err, tx) {
      var store = tx.objectStore("assignments")
        , oncomplete = [];

      store.get(payload.localId).onsuccess = function(evt) {
        var assignment = evt.target.result;

        assignment.title = payload.title;
        store.put(assignment).onsuccess = function(evt) {
          this.emit('change', { assignment: assignment });

          oncomplete.push(function() {
            this.flux.actions.persistAssignment(assignment.localId);
          }.bind(this));
        }.bind(this);
      }.bind(this);

      tx.oncomplete = function() {
        _.each(oncomplete, function(cb) { cb(); });
      }.bind(this);
    }.bind(this));
  }

  /**
   * Emits a change with the assignment list
   */
  @action(constants.DESTROY_ASSIGNMENT_SUCCESS)
  handleDestroyAssignmentSuccess (payload) {
    this.db.assignments.all().then(function(assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  }

  /**
   * Emits a change event from this store with the complete list of assignments
   */
  @action(constants.ASSIGNMENTS_SYNCHRONIZED)
  handleAssignmentsSynchronized () {
    this.db.assignments.all().then(function(assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  }

  @action(constants.MAKE_ASSIGNMENT_VISIBLE)
  handleMakeAssignmentVisible (payload) {
    logger.info('handleMakeAssignmentVisible');

    this.db.assignments.get(payload.localId).then(function(assignment) {
      if (assignment && assignment.id) {
        var data = {
          assignment: {
            visible: true
          }
        };

        new TrailblazerHTTPStorageAdapter().update("assignments", assignment.id, data, {})
          .then(function(response) {
            //success
            this.db.assignments.db.transaction("readwrite", ["assignments"], function(err, tx) {
              var successCallbacks = [];

              var store = tx.objectStore("assignments");

              store.get(assignment.localId).onsuccess = function(evt) {
                var assignment = evt.target.result;

                assignment.visible = response.visible;
                assignment.url = response.url;

                store.put(assignment).onsuccess = function(evt) {
                  successCallbacks.push(function() {
                    this.emit('change', { assignment: assignment });
                  }.bind(this));
                }.bind(this);

              }.bind(this);

              tx.oncomplete = function() {
                _.each(successCallbacks, function(cb) { cb(); });
              };

            }.bind(this));
          }.bind(this),
          function (response) {
            //error
          }.bind(this));
      }
    }.bind(this));
  }

  @action(constants.MAKE_ASSIGNMENT_HIDDEN)
  handleMakeAssignmentHidden (payload) {
    logger.info('handleMakeAssignmentHidden');

    this.db.assignments.get(payload.localId).then(function(assignment) {
      if (assignment && assignment.id) {
        var data = {
          assignment: {
            visible: false
          }
        };

        new TrailblazerHTTPStorageAdapter().update("assignments", assignment.id, data, {})
          .then(function(response) {
            //success
            this.db.assignments.db.transaction("readwrite", ["assignments"], function(err, tx) {
              var successCallbacks = [];

              var store = tx.objectStore("assignments");

              store.get(assignment.localId).onsuccess = function(evt) {
                var assignment = evt.target.result;

                assignment.visible = response.visible;
                assignment.url = response.url;

                store.put(assignment).onsuccess = function(evt) {
                  successCallbacks.push(function() {
                    this.emit('change', { assignment: assignment });
                  }.bind(this));
                }.bind(this);

              }.bind(this);

              tx.oncomplete = function() {
                _.each(successCallbacks, function(cb) { cb(); });
              };

            }.bind(this));
          }.bind(this),
          function (response) {
            //error
          }.bind(this));
      }
    }.bind(this));
  }

};

export default AssignmentStore;
