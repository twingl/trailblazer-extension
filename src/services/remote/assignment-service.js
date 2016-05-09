import HTTPAdapter from '../../adapter/trailblazer_http_storage_adapter';

class AssignmentService {
  constructor(flux) {
    this.flux = flux;
  }

  list(params) {
    return new HTTPAdapter().list('assignments', params);
  }

  create(attributes, options) {
    return new HTTPAdapter().create('assignments', attributes, options);
  }

  get(id, params) {
    return new HTTPAdapter().read('assignments', id, params);
  }

  update(id, attributes, options) {
    return new HTTPAdapter().update('assignments', id, attributes, options);
  }

  destroy(id) {
    return new HTTPAdapter().destroy('assignments', id);
  }

  destroyMany(ids) {
    return new HTTPAdapter().bulkDestroy('assignments', ids);
  }
};

export { AssignmentService };
export default AssignmentService;
