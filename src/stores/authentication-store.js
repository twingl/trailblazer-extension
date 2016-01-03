import _         from 'lodash';
import constants from '../constants';
import Logger    from '../util/logger';

import Store from '../lib/store';

import { query, action } from '../decorators';

var logger = Logger('stores/authentication-store.js');

import ChromeIdentityAdapter from '../adapter/chrome_identity_adapter';

class AuthenticationStore extends Store {

  constructor (options = {}) {
    super(options);

    this.authenticated = false;

    this.db = options.db;

    new ChromeIdentityAdapter().isSignedIn().then( function(signedIn) {
      this.authenticated = signedIn;
    }.bind(this));

  }

  getState () {
    return {
      authenticated: this.authenticated
    };
  }

  /**
   * Call on the ChromeIdentityAdapter to initiate the sign in process.
   */
  @action(constants.SIGN_IN)
  handleSignIn () {
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
  }

  /**
   * Call on the ChromeIdentityAdapter to invalidate the current session.
   */
  @action(constants.SIGN_OUT)
  handleSignOut () {
    new ChromeIdentityAdapter().signOut().done(function () {
      this.authenticated = false;
      this.emit('change', this.getState());
    }.bind(this));
  }

};

export default AuthenticationStore;
