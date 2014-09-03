(function (context) {
  'use strict';

  /**
   * Creates a new ChromeIdentityAdapter
   *
   * @class ChromeIdentityAdapter
   * @classdesc
   * Maintains the authenticated state of the extension and provides a common
   * interface to authenticate with the chrome.identity.* APIs
   *
   * @param {StateManager} stateManager - A reference to the {@link
   * StateManager} instance that is creating and using this adapter.
   */

  context.ChromeIdentityAdapter = function(stateManager) {
    /**
     * @property {StateManager} _stateManager - The {@link StateManager}
     * instance that is using this adapter
     * @private
     */
    this._stateManager = stateManager;
  };

  /**
   * @TODO Launch the sign in flow
   * @function ChromeIdentityAdapter#signIn
   * @returns {Promise}
   */
  context.ChromeIdentityAdapter.prototype.signIn = function() {};

  /**
   * @TODO Terminate the currently authenticated session
   * @function ChromeIdentityAdapter#signOut
   */
  context.ChromeIdentityAdapter.prototype.signOut = function() {};

  /**
   * @function ChromeIdentityAdapter#profile
   * @TODO Get the currently authenticated person's profile information
   */
  context.ChromeIdentityAdapter.prototype.profile = function() {};

}(window));
