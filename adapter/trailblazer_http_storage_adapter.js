(function (context) {
  'use strict';

  /**
   * Creates a new TrailblazerHTTPStorageAdapter
   *
   * @class TrailblazerHTTPStorageAdapter
   * @classdesc
   * Provides an abstracted interface to the REST-like API Trailblazer
   * implements. Access is, by default, through CRUD methods (create, read,
   * update, destroy, and list).
   *
   * @param {StateManager} stateManager - A reference to the {@link
   * StateManager} instance that is creating and using this adapter.
   */

  context.TrailblazerHTTPStorageAdapter = function(stateManager) {
    /**
     * @property {StateManager} _stateManager - The {@link StateManager}
     * instance that is using this adapter
     * @private
     */
    this._stateManager = stateManager;
  };

  /**
   * Make an HTTP request. Used to implement the CRUD methods.
   * @function TrailblazerHTTPStorageAdapter#_request
   * @param {string} url
   * @param {string} httpMethod
   * @param {Object} opts
   * @param {Object} opts.params - Parameters to append to the request URL
   * @param {Object} opts.data - Data to send with the request (i.e. request
   * body)
   * @private
   */
  context.TrailblazerHTTPStorageAdapter.prototype._request = function(url, httpMethod, opts) {
    var httpMethod = httpMethod || "GET"
      , opts   = opts   || {};

    // To make an authenticated request we must ensure that we are signed in
    var promise = new Promise(function(resolve, reject) {
      this._stateManager.signIn().then(function(auth) {
        superagent(httpMethod, url)
          .set("Authorization", "Bearer " + auth.access_token)
          .set("Content-Type", "application/json")
          .set("Accept", "application/json")
          .send(opts.data || {})
          .query(opts.params || {})
          .end(function(response) {
            if (response.ok) {
              resolve(response.body);
            } else {
              reject(response);
            }
          }); //superagent
      }.bind(this), function() {
        throw "Tried to make authenticated request while signed out!"
      }); //_stateManager.signIn()
    }.bind(this)); //promise

    return promise;
  };

  /**
   * Read a resource from the server. Makes a request `GET
   * http(s)://server.com/resource/id` with optional URL params
   * @function TrailblazerHTTPStorageAdapter#read
   * @param {string} resourceName - Name of the resource to fetch
   * @param {string} id - (Optional) id of the resource
   * @param {Object} params - URL params to append to the request
   * @returns {Promise}
   */
  context.TrailblazerHTTPStorageAdapter.prototype.read = function(resourceName, id, params) {
    if (!resourceName) throw "You need to specify a resource";
    if (!id) throw "You need to specify an ID - maybe you want list instead";

    var url = this._stateManager.getConfig().api.host + "/"
            + this._stateManager.getConfig().api.nameSpace + "/"
            + this._stateManager.getConfig().api.version + "/"
            + resourceName + "/"
            + id;

    return this._request(url, "GET", { params: params });
  };

  /**
   * Retrieve a list of resources from the server. Makes a request `GET
   * http(s)://server.com/resource` with optional URL params
   * @function TrailblazerHTTPStorageAdapter#list
   * @param {string} resourceName - Name of the resource to fetch
   * @param {Object} params - URL params to append to the request
   */
  context.TrailblazerHTTPStorageAdapter.prototype.list = function(resourceName, params) {
    if (!resourceName) throw "You need to specify a resource";

    var url = this._stateManager.getConfig().api.host + "/"
            + this._stateManager.getConfig().api.nameSpace + "/"
            + this._stateManager.getConfig().api.version + "/"
            + resourceName;

    return this._request(url, "GET", { params: params });
  };

  /**
   * @todo Create a new resource
   * @function TrailblazerHTTPStorageAdapter#create
   */
  context.TrailblazerHTTPStorageAdapter.prototype.create = function(resourceName, props, options) {
    if (!resourceName) throw "You need to specify a resource";

    var url = this._stateManager.getConfig().api.host + "/"
            + this._stateManager.getConfig().api.nameSpace + "/"
            + this._stateManager.getConfig().api.version + "/"

    if (options.parentResource) {
      url += options.parentResource.name + "/"
          +  options.parentResource.id + "/"
    };

    url += resourceName;

    return this._request(url, "POST", { data: props });
  };

  /**
   * @todo Update a resource
   * @function TrailblazerHTTPStorageAdapter#update
   */
  context.TrailblazerHTTPStorageAdapter.prototype.update = function(resourceName, id, props, options) {
    if (!resourceName) throw "You need to specify a resource";
    if (!id) throw "You need to specify an ID";

    var url = this._stateManager.getConfig().api.host + "/"
            + this._stateManager.getConfig().api.nameSpace + "/"
            + this._stateManager.getConfig().api.version + "/"

    if (options.parentResource) {
      url += options.parentResource.name + "/"
          +  options.parentResource.id + "/"
    };

    url += resourceName + "/" + id;

    return this._request(url, "PUT", { data: props });
  };

  /**
   * @todo Destroy a resource
   * @function TrailblazerHTTPStorageAdapter#destroy
   */
  context.TrailblazerHTTPStorageAdapter.prototype.destroy = function(resourceName, id) {
    if (!resourceName) throw "You need to specify a resource";
    if (!id) throw "You need to specify an ID";

    var url = this._stateManager.getConfig().api.host + "/"
            + this._stateManager.getConfig().api.nameSpace + "/"
            + this._stateManager.getConfig().api.version + "/"
            + resourceName + "/" + id;

    return this._request(url, "DELETE");
  };
}(window));
