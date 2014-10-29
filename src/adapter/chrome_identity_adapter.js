// config
var config = require('../config');

// helpers
var Promise    = require('promise');
var superagent = require('superagent');
var _          = require('lodash');

module.exports = ChromeIdentityAdapter;

/**
 * Creates a new ChromeIdentityAdapter
 *
 * @class ChromeIdentityAdapter
 * @classdesc
 * Maintains the authenticated state of the extension and provides a common
 * interface to authenticate with the chrome.identity.* APIs
 */

var ChromeIdentityAdapter = function() { };

/**
 * Consults chrome.storage.sync to check if a token already exists, resolving
 * the returned promise if it does. If a token is not already stored, the
 * sign in flow will be launched.
 *
 * Then, if resolved (i.e. on a successful sign in), the callback will be
 * passed an object containing details about the access token;
 * ```javascript
 * {
 *   access_token: "string",
 *   token_type: "bearer",
 *   expires_in: number(seconds)
 * }
 * ```
 *
 * If rejected (user denies access or the prompt is closed) the callback will
 * either be passed an object detailing the rejection;
 * ```javascript
 * {
 *   error: "error code",
 *   error_description: "description"
 * }
 * ```
 * in the case of explicit denial, or the exception in the event of some
 * other failure.
 *
 * @function ChromeIdentityAdapter#signIn
 * @returns {Promise}
 */
ChromeIdentityAdapter.prototype.signIn = function() {
  var redirect = encodeURIComponent("https://" + chrome.runtime.id + ".chromiumapp.org/")
    , host     = config.api.host
    , version  = config.api.version
    , clientId = config.api.clientId;

  var params = "?" + [
    "client_id="+clientId,
    "response_type=token",
    "redirect_uri="+redirect
  ].join("&");

  var authUrl = [host, "oauth/authorize"].join("/") + params;

  var promise = new Promise(function(resolve, reject) {
    this.getToken().then(function(token) {
      resolve(token);
    }, function() {
      chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, function(redirectUrl) {
        if (redirectUrl) {
          // Slice up the redirect and parse the response object from url hash
          var response = redirectUrl.substring(redirectUrl.indexOf("#") + 1)
            , responseObject = {};

          _.each(response.split("&"), function(item) {
            var i = item.split("=");
            responseObject[i[0]] = i[1];
          });

          if (responseObject.access_token) {
            // If we have an access token then add some useful properties,
            // store it, and resolve the promise with it
            responseObject.expires_in = parseInt(responseObject.expires_in);
            responseObject.expires_at = Date.now() + responseObject.expires_in;

            this.storeToken(responseObject);
            resolve(responseObject);
          } else {
            // Otherwise, reject it with the details
            reject(responseObject);
          }
        } else {
          reject(chrome.runtime.lastError);
        }
      }.bind(this)); //chrome.identity.launchWebAuthFlow
    }.bind(this)); //getToken();
  }.bind(this)); //promise

  return promise;
};

/**
 * Terminate the currently authenticated session. Returns a promise which
 * resolves if the token was successfully revoked (passing no parameters) and
 * rejects if an error occurred, passing the failed request as its only
 * parameter.
 * @function ChromeIdentityAdapter#signOut
 * @returns {Promise}
 */
ChromeIdentityAdapter.prototype.signOut = function() {
  var promise = new Promise(function(resolve, reject) {
    chrome.storage.sync.get("token", function(token) {
      if (token.token) {
        var token = JSON.parse(token.token);

        superagent.post(config.api.host + "/oauth/revoke")
          .send({ token: token.access_token })
          .set("Content-Type", "application/x-www-form-urlencoded")
          .end(function(response) {
            if (response.ok) {
              this._clearToken();
              resolve();
            } else {
              reject(response);
            }
          }.bind(this)); //superagent
      } else {
        resolve(); // there's no token
      }
    }.bind(this)); //chrome.storage.sync.get
  }.bind(this)); //promise

  return promise;
};

/**
 * Check whether there is a valid token available. Promise will always
 * resolve, passing a single boolean parameter indicating whether there is a
 * token available or not.
 * @function ChromeIdentityAdapter#isSignedIn
 * @returns {Promise}
 */
ChromeIdentityAdapter.prototype.isSignedIn = function() {
  return new Promise(function(resolve, reject) {
    this.getToken().then(
        function() { resolve(true); },
        function() { resolve(false); })
  }.bind(this));
};

/**
 * @function ChromeIdentityAdapter#profile
 * @TODO Get the currently authenticated person's profile information
 */
ChromeIdentityAdapter.prototype.profile = function() {};

/**
 * Retrieves the token stored in chrome.storage.sync
 * @function ChromeIdentityAdapter#getToken
 * @returns {Promise} A promise which resolves with the token object if it
 * was found
 */
ChromeIdentityAdapter.prototype.getToken = function() {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.get("token", function(token) {
      if (token.token) {
        resolve(JSON.parse(token.token));
      } else if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        reject();
      }
    }); //chrome.storage.sync.get
  }); //promise
};

/**
 * Stores the provided token in chrome.storage.sync
 * @function ChromeIdentityAdapter#storeToken
 * @param {Object} tokenObject - the token passed to {@link
 * ChromeIdentityAdapter#signIn}'s `resolve`
 * @returns {Promise} A promise which resolves if chrome.runtime.lastError is
 * not set
 */
ChromeIdentityAdapter.prototype.storeToken = function(tokenObject) {
  return new Promise(function(resolve, reject) {
    var userUrl = [
      config.api.host,
      config.api.nameSpace,
      config.api.version,
      "me"
    ].join("/");

    superagent("GET", userUrl)
      .set("Authorization", "Bearer " + tokenObject.access_token)
      .set("Accept", "application/json")
      .end(function(response) {
        tokenObject.user_id = response.body.id;
        chrome.storage.sync.set({ token: JSON.stringify(tokenObject) }, function() {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        }); //chrome.storage.sync.set
      });
  }.bind(this)); //promise
};

/**
 * Clears the stored token from chrome.storage.sync
 * @function ChromeIdentityAdapter#_clearToken
 * @returns {Promise} A promise which resolves if chrome.runtime.lastError is
 * not set
 * @private
 */
ChromeIdentityAdapter.prototype._clearToken = function() {
  return new Promise(function(resolve, reject) {
    chrome.storage.sync.remove("token", function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    }); //chrome.storage.sync.remove
  }); //promise
};
