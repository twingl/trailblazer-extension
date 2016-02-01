import _         from 'lodash';
import constants from '../constants';

import Store from '../lib/store';

import { query, action } from '../decorators';

import Logger from '../util/logger';
var logger = Logger('stores/authentication-store.js');

import ChromeIdentityAdapter from '../adapter/chrome_identity_adapter';

class AuthenticationStore extends Store {

  constructor(options = {}) {
    super(options);

    this.authenticated = false;

    this.db = options.db;

    new ChromeIdentityAdapter().isSignedIn().then((signedIn) => {
      this.authenticated = signedIn;
    });

  }

  getState() {
    return {
      authenticated: this.authenticated
    };
  }

  /**
   * Call on the ChromeIdentityAdapter to initiate the sign in process.
   */
  @action(constants.SIGN_IN)
  handleSignIn() {
    new ChromeIdentityAdapter().signIn().done(
        () => {
          this.authenticated = true;
          this.emit('change', this.getState());
          this.flux.actions.requestAssignments();
          this.flux.actions.signInSuccess();
        },
        () => {
          this.authenticated = false;
          this.emit('change', this.getState());
        });
  }

  /**
   * Call on the ChromeIdentityAdapter to invalidate the current session.
   */
  @action(constants.SIGN_OUT)
  handleSignOut() {
    new ChromeIdentityAdapter().signOut().done(() => {
      this.authenticated = false;
      this.emit('change', this.getState());
    });
  }

};

export default AuthenticationStore;
