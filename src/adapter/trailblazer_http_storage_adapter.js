// config
var config = require('../config');

// adapters
var ChromeIdentityAdapter = require('./chrome_identity_adapter');

// helpers
var Promise    = require('promise');
var superagent = require('superagent');

module.exports = TrailblazerHTTPStorageAdapter;

/**
 * Creates a new TrailblazerHTTPStorageAdapter
 *
 * @class TrailblazerHTTPStorageAdapter
 * @classdesc
 * Provides an abstracted interface to the REST-like API Trailblazer
 * implements. Access is, by default, through CRUD methods (create, read,
 * update, destroy, and list).
 */

var TrailblazerHTTPStorageAdapter = function() { };

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
TrailblazerHTTPStorageAdapter.prototype._request = function(url, httpMethod, opts) {
  var httpMethod = httpMethod || "GET"
    , opts   = opts   || {};

  // To make an authenticated request we must ensure that we are signed in
  var promise = new Promise(function(resolve, reject) {
    new ChromeIdentityAdapter().getToken().then(function(auth) {
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
      throw "Tried to make authenticated request without token!
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
TrailblazerHTTPStorageAdapter.prototype.read = function(resourceName, id, params) {
  if (!resourceName) throw "You need to specify a resource";
  if (!id) throw "You need to specify an ID - maybe you want list instead";

  var url = [
    config.api.host,
    config.api.nameSpace,
    config.api.version,
    resourceName,
    id
  ].join("/");

  return this._request(url, "GET", { params: params });
};

/**
  * Retrieve a list of resources from the server. Makes a request `GET
  * http(s)://server.com/resource` with optional URL params
  * @function TrailblazerHTTPStorageAdapter#list
  * @param {string} resourceName - Name of the resource to fetch
  * @param {Object} params - URL params to append to the request
  */
TrailblazerHTTPStorageAdapter.prototype.list = function(resourceName, params) {
  if (!resourceName) throw "You need to specify a resource";

  var url = [
    config.api.host,
    config.api.nameSpace,
    config.api.version,
    resourceName
  ].join("/");

  return this._request(url, "GET", { params: params });
};

/**
  * @todo Create a new resource
  * @function TrailblazerHTTPStorageAdapter#create
  */
TrailblazerHTTPStorageAdapter.prototype.create = function(resourceName, props, options) {
  if (!resourceName) throw "You need to specify a resource";

  var url = [
    config.api.host,
    config.api.nameSpace,
    config.api.version
  ];

  if (options.parentResource) {
    url.push(options.parentResource.name, options.parentResource.id);
  };

  url.push(resourceName);

  url = url.join("/");

  return this._request(url, "POST", { data: props });
};

/**
  * @todo Update a resource
  * @function TrailblazerHTTPStorageAdapter#update
  */
TrailblazerHTTPStorageAdapter.prototype.update = function(resourceName, id, props, options) {
  if (!resourceName) throw "You need to specify a resource";
  if (!id) throw "You need to specify an ID";

  var url = [
    config.api.host,
    config.api.nameSpace,
    config.api.version
  ];

  if (options.parentResource) {
    url.push(options.parentResource.name, options.parentResource.id);
  };

  url.push(resourceName, id);
  url = url.join("/");

  return this._request(url, "PUT", { data: props });
};

/**
  * @todo Destroy a resource
  * @function TrailblazerHTTPStorageAdapter#destroy
  */
TrailblazerHTTPStorageAdapter.prototype.destroy = function(resourceName, id) {
  if (!resourceName) throw "You need to specify a resource";
  if (!id) throw "You need to specify an ID";

  var url = [
    config.api.host,
    config.api.nameSpace,
    config.api.version,
    resourceName,
    id
  ].join("/");

  return this._request(url, "DELETE");
};
