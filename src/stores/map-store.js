var _         = require('lodash')
 ,  Fluxxor   = require('fluxxor')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  uuid      = require('node-uuid');

//TODO 
// handleTabCreated
// handleTabUpdated
// handleTabClosed
// handleTabFocused
// handleStopRecording
// handleMarkedAsWaypoint
// handleMapTitleUpdated
// handleMapShared


var MapStore = Fluxxor.createStore({

  initialize: function (options) {
    var options = options || {};
    this.mapObj = options.mapObj || {};
    this.loading = false;
    this.error = null;

    this.bindActions(
      constants.LOAD_MAP, this.onLoadMaps,
      constants.LOAD_MAP_SUCCESS, this.onLoadMapsSuccess,
      constants.LOAD_MAP_FAIL, this.onLoadMapsFail,

      constants.ADD_MAP, this.onAddMap,
      constants.ADD_MAP_SUCCESS, this.onAddMapSuccess,
      constants.ADD_MAP_FAIL, this.onAddMapFail
    );
  },

  getState: function () {
    console.log('getting map state')

    return {
      mapObj: this.mapObj,
      loading: this.loading,
      error: this.error
    };
  },

  onLoadMaps: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadMapsSuccess: function(payload) {
    this.loading = false;
    this.error = null;


    //make an immutable obj.
    var obj = payload.maps
      .reduce(function(o, map) {
        console.log('reducing', o, map)
        var id = map.id;
        o[id] = map;
        return acc;
      }, {});

    this.mapObj = Immutable.fromJS(obj);

    this.emit("change");
  },

  onLoadMapsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit("change");
  },

  onAddMap: function(payload) {
    var node = payload.node;
    var id = node.id || Node._getId();
    this.mapObj.set(id, node);
    this.emit("change");
  },

  onAddMapSuccess: function(payload) {
    var id = payload.node.id;
    this.mapObj.updateIn([id, 'status'], function(val) { return "OK" });
    this.emit("change");
  },

  onAddMapFail: function(payload) {
    var id = payload.node.id;
    this.mapObj.updateIn([id, 'status'], function(val) { return "ERROR" });
    this.mapObj.updateIn([id, 'error'], function(val) { return payload.error });
    this.emit("change");Map
  }

});

module.exports = MapStore;