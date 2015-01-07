var _         = require('lodash')
  , React     = require('react/addons')
  , domready  = require('domready')
  , router    = require('react-mini-router')
  , actions   = require('../actions')
  , constants = require('../constants')
  , info      = require('debug')('popup/app.js:info');

// Components
var Idle      = React.createFactory(require('app/components/popup/idle'))
  , Loading   = React.createFactory(require('app/components/popup/loading'))
  , Login     = React.createFactory(require('app/components/popup/login'))
  , Recording = React.createFactory(require('app/components/popup/recording'));

// Set up routes
var RouterMixin = router.RouterMixin
  , navigate    = router.navigate;

module.exports = React.createClass({
  mixins: [ RouterMixin ],
  routes: {
    '/':          'loading',
    '/idle':      'idle',
    '/recording': 'recording',
    '/login':     'login'
  },

  render: function () {
    info('render: Rendering with state', { state: this.props.state });
    return this.renderCurrentRoute();
  },

  componentDidMount: function () {
    info('componentDidMount:', { props: this.props });

    // Bind listeners
    chrome.runtime.onMessage.addListener( function (message) {
      switch (message.action) {
        case constants.__change__:
          // See if the change affects this popup
          break;

        case constants.REQUEST_TAB_STATE_RESPONSE:
          if (message.payload.state.recording) {
            navigate('/recording')
          } else {
            navigate('/idle')
          }
        default:
          info("Ignoring message " + message.action, message);
          return;
      }
    });

    actions.requestTabState(this.props.tabId);
    // Request state
    // Update App state
    // Render App component
  },

  /**
   * /
   * Default route, rendered when state is not yet present
   */
  loading: function () {
    info('loading:', { state: this.props.state });
    return Loading({ state: this.props.state });
  },

  /**
   * /idle
   * Displays the idle popup interface - signed in and not recording the
   * current tab
   */
  idle: function () {
    info('idle:', { state: this.props.state });
    return Idle({ state: this.props.state });
  },

  /**
   * /recording
   * Displays the recording interface with the current assignment when signed
   * in and recording the current tab.
   */
  recording: function () {
    info('recording:', { state: this.props.state });
    return Recording({ state: this.props.state });
  },

  /**
   * /login
   * Displays the sign in form when not signed in
   */
  login: function () {
    info('login:', { state: this.props.state });
    return Login({ state: this.props.state });
  }

});
