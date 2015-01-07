var _                     = require('lodash')
  , React                 = require('react/addons')
  , domready              = require('domready')
  , router                = require('react-mini-router')
  , actions               = require('../actions')
  , ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , constants             = require('../constants')
  , info                  = require('debug')('popup/app.js:info');

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
    info('render: Rendering with props', { props: this.props });
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
            this.props.assignment = message.payload.state.assignment;
            navigate('/recording');
          } else {
            delete this.props.assignment;
            navigate('/idle');
          }
          break;
        default:
          info("Ignoring message " + message.action, message);
          return;
      }
    }.bind(this));

    new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
      if (signedIn) {
        actions.requestTabState(this.props.tabId);
      } else {
        navigate('/login');
      }
    }.bind(this));

    // Request state
    // Update App state
    // Render App component
  },

  /**
   * /
   * Default route, rendered when state is not yet present
   */
  loading: function () {
    info('loading:', { props: this.props });
    return Loading();
  },

  /**
   * /idle
   * Displays the idle popup interface - signed in and not recording the
   * current tab
   */
  idle: function () {
    info('idle:', { props: this.props });
    return Idle({ tabId: this.props.tabId });
  },

  /**
   * /recording
   * Displays the recording interface with the current assignment when signed
   * in and recording the current tab.
   */
  recording: function () {
    info('recording:', { props: this.props });
    return Recording({ tabId: this.props.tabId, assignment: this.props.assignment });
  },

  /**
   * /login
   * Displays the sign in form when not signed in
   */
  login: function () {
    info('login:', { props: this.props });
    return Login({ tabId: this.props.tabId });
  }

});
