var _         = require('lodash')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor');

var debug = require('debug')
  , info  = debug('stores/authentication-store.js:info')
  , warn  = debug('stores/authentication-store.js:warn');

var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter');

var AuthenticationStore = Fluxxor.createStore({

  initialize: function (options) {
    var options = options || {};

    this.authenticated = false;

    this.db = options.db;

    this.bindActions(
      constants.SIGN_IN,  this.handleSignIn,
      constants.SIGN_OUT, this.handleSignOut
    );

    new ChromeIdentityAdapter().isSignedIn().then( function(signedIn) {
      this.authenticated = signedIn;
    }.bind(this));

  },

  getState: function () {
    return {
      authenticated: this.authenticated
    };
  },

  /**
   * Call on the ChromeIdentityAdapter to initiate the sign in process.
   */
  handleSignIn: function () {
    new ChromeIdentityAdapter().signIn().done(
        function () {
          this.authenticated = true;
          this.emit('change', this.getState());
          this.flux.actions.requestAssignments();
          this.flux.actions.signInSuccess();
        }.bind(this),
        function () {
          this.authenticated = false;
          this.emit('change', this.getState());
        }.bind(this));
  },

  /**
   * Call on the ChromeIdentityAdapter to invalidate the current session.
   */
  handleSignOut: function () {
    new ChromeIdentityAdapter().signOut().done(function () {
      this.authenticated = false;
      this.emit('change', this.getState());
    }.bind(this));
  }

});

module.exports = AuthenticationStore;
