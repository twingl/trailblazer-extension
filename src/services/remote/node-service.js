import HTTPAdapter from '../../adapter/trailblazer_http_storage_adapter';

class NodeService {
  constructor(flux) {
    this.flux = flux;
  }

  list(assignmentId, params) {
    const resource = `assignments/${assignmentId}/nodes`
    return new HTTPAdapter().list(resource, params);
  }

  create(assignmentId, attributes, options) {
    const resource = `assignments/${assignmentId}/nodes`
    return new HTTPAdapter().create(resource, attributes, options);
  }

  get(id, params) {
    return new HTTPAdapter().read('nodes', id, params);
  }

  update(id, attributes, options) {
    return new HTTPAdapter().update('nodes', id, attributes, options);
  }

  destroy(id) {
    return new HTTPAdapter().destroy('nodes', id);
  }

  destroyMany(ids) {
    return new HTTPAdapter().bulkDestroy('nodes', ids);
  }
};

export { NodeService };
export default NodeService;
