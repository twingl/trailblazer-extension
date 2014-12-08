var _ = require('lodash');

module.exports = function (locals, remotes) {
  var del = [];
  var remoteIDs = _.pluck(remotes, 'id');
  var persistedEntities = _.filter(locals, 'id');

  for (var i=0;i<persistedEntities.length;i++) {
  	var persistedEntity = persistedEntities[i];

  	if (remoteIDs.indexOF(persistedEntity.id) !== -1) {
  		_.find(remotes, { id: persistedEntity.id }).localId = persistedEntity.localId;
  	}
  	else {
  		del.push(persistedEntity.id);
  	}
  }

  return {
  	del: del,
  	put: remotes
  }
}