import _                             from 'lodash';
import constants                     from '../constants';
import TrailblazerHTTPStorageAdapter from '../adapter/trailblazer_http_storage_adapter';

import Store from '../lib/store';
import { query, action } from '../decorators';

import Logger from '../util/logger';
var logger = Logger('stores/assignment-store.js');

class AssignmentStore extends Store {

  constructor (options = {}) {
    super(options);

    this.db = options.db;
  }

  @query
  async getAssignments() {
    var assignments = await this.db.assignments.all();
    return assignments;
  }

  @query
  async getAssignmentByLocalId(localId) {
    var assignment = await this.db.assignments.get(localId);
    return assignment;
  }

  @query
  async getAssignmentByRemoteId(remoteId) {
    var assignment = await this.db.assignments.index('id').get(remoteId);
    return assignment;
  }

  @action(constants.SIGN_OUT)
  handleSignOut() {
    this.db.assignments.clear();
  }

  /**
   * Emit all assignment data
   */
  @action(constants.REQUEST_ASSIGNMENTS)
  handleRequestAssignments() {
    logger.warn("DEPRECATED");
    // Get the assignments from the DB, fire a change, and fire a fetch assignments
    this.db.assignments.all().then((assignments) => {
      this.emit('change', { assignments: assignments });
      this.flux.actions.fetchAssignments();
    });
  }

  /**
   * Emit all assignment data
   */
  @action(constants.CREATE_ASSIGNMENT_SUCCESS)
  handleCreateAssignmentSuccess() {
    this.db.assignments.all().then((assignments) => {
      this.emit('change', { assignments: assignments });
    });
  }

  /**
   * Updates an assignment record with a new title
   */
  @action(constants.UPDATE_ASSIGNMENT_TITLE)
  handleUpdateAssignmentTitle(payload) {
    logger.info('handleUpdateAssignmentTitle', { payload: payload });
    this.db.assignments.db.transaction("readwrite", ["assignments"], (err, tx) => {
      var store = tx.objectStore("assignments")
        , oncomplete = [];

      store.get(payload.localId).onsuccess = (evt) => {
        var assignment = evt.target.result;

        assignment.title = payload.title;
        store.put(assignment).onsuccess = (evt) => {
          this.emit('change', { assignment: assignment });

          oncomplete.push(() => {
            setTimeout(() => this.flux.actions.persistAssignment(assignment.localId));
          });
        };
      };

      tx.oncomplete = () => {
        _.each(oncomplete, cb => cb());
      };

    });
  }

  /**
   * Emits a change with the assignment list
   */
  @action(constants.DESTROY_ASSIGNMENT_SUCCESS)
  handleDestroyAssignmentSuccess(payload) {
    this.db.assignments.all().then((assignments) => {
      this.emit('change', { assignments: assignments });
    });
  }

  /**
   * Emits a change event from this store with the complete list of assignments
   */
  @action(constants.ASSIGNMENTS_SYNCHRONIZED)
  handleAssignmentsSynchronized() {
    this.db.assignments.all().then((assignments) => {
      this.emit('change', { assignments: assignments });
    });
  }

  @action(constants.MAKE_ASSIGNMENT_VISIBLE)
  handleMakeAssignmentVisible(payload) {
    logger.info('handleMakeAssignmentVisible');

    this.db.assignments.get(payload.localId).then((assignment) => {
      if (assignment && assignment.id) {
        var data = {
          assignment: {
            visible: true
          }
        };

        new TrailblazerHTTPStorageAdapter().update("assignments", assignment.id, data, {})
          .then((response) => {
            //success
            this.db.assignments.db.transaction("readwrite", ["assignments"], (err, tx) => {
              var successCallbacks = [];

              var store = tx.objectStore("assignments");

              store.get(assignment.localId).onsuccess = (evt) => {
                var assignment = evt.target.result;

                assignment.visible = response.visible;
                assignment.url = response.url;

                store.put(assignment).onsuccess = (evt) => {
                  successCallbacks.push(() => {
                    this.emit('change', { assignment: assignment });
                  });
                };

              };

              tx.oncomplete = () => {
                _.each(successCallbacks, (cb) => { cb(); });
              };

            });
          },
          (response) => {
            //error
          }
        );
      }
    });
  }

  @action(constants.MAKE_ASSIGNMENT_HIDDEN)
  handleMakeAssignmentHidden(payload) {
    logger.info('handleMakeAssignmentHidden');

    this.db.assignments.get(payload.localId).then((assignment) => {
      if (assignment && assignment.id) {
        var data = {
          assignment: {
            visible: false
          }
        };

        new TrailblazerHTTPStorageAdapter().update("assignments", assignment.id, data, {})
          .then((response) => {
            //success
            this.db.assignments.db.transaction("readwrite", ["assignments"], (err, tx) => {
              var successCallbacks = [];

              var store = tx.objectStore("assignments");

              store.get(assignment.localId).onsuccess = (evt) => {
                var assignment = evt.target.result;

                assignment.visible = response.visible;
                assignment.url = response.url;

                store.put(assignment).onsuccess = (evt) => {
                  successCallbacks.push(() => {
                    this.emit('change', { assignment: assignment });
                  });
                };

              };

              tx.oncomplete = () => {
                _.each(successCallbacks, (cb) => { cb(); });
              };

            });
          },
          function (response) {
            //error
          });
      }
    });
  }

};

export default AssignmentStore;
