var _                     = require('lodash')
  , React                 = require('react/addons')
  , router                = require('react-mini-router')
  , actions               = require('../actions')
  , ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , constants             = require('../constants')
  , Logger                = require('../util/logger');

var logger = Logger('popup/app.js');

// Components
var Idle      = React.createFactory(require('../components/popup/idle'))
  , Loading   = React.createFactory(require('../components/popup/loading'))
  , SignIn    = React.createFactory(require('../components/popup/sign-in'))
  , Recording = React.createFactory(require('../components/popup/recording'));

// Set up routes
var RouterMixin = router.RouterMixin
  , navigate    = router.navigate;

module.exports = React.createClass({
  mixins: [ RouterMixin ],
  routes: {
    '/':          'loading',
    '/idle':      'idle',
    '/recording': 'recording',
    '/sign_in':   'signIn'
  },

  render: function () {
    logger.info('render: Rendering with props', { props: this.props });
    return this.renderCurrentRoute();
  },

  componentDidMount: function () {
    logger.info('componentDidMount:', { props: this.props });

    // Bind listeners
    chrome.runtime.onMessage.addListener( function (message) {
      switch (message.action) {
        case constants.__change__:
          // See if the change affects this popup
          if (message.storeName === "AuthenticationStore" &&
              message.payload.authenticated !== true) {
            navigate('/sign_in');
          }
          break;

        case constants.REQUEST_TAB_STATE_RESPONSE:
          if (message.payload.state.recording) {
            this.props.node = message.payload.state.node;
            this.props.assignment = message.payload.state.assignment;
            navigate('/recording');
          } else {
            delete this.props.node;
            delete this.props.assignment;
            navigate('/idle');
          }
          break;
        default:
          logger.info("Ignoring message " + message.action, message);
          return;
      }
    }.bind(this));

    new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
      if (signedIn) {
        actions.requestTabState(this.props.tabId);
      } else {
        navigate('/sign_in');
      }
    }.bind(this));
  },

  /**
   * /
   * Default route, rendered when state is not yet present
   */
  loading: function () {
    logger.info('loading:', {
      props: this.props,
      constants: constants,
      actions: actions
    });
    return Loading();
  },

  /**
   * /idle
   * Displays the idle popup interface - signed in and not recording the
   * current tab
   */
  idle: function () {
    logger.info('idle:', { props: this.props });
    return Idle({
      tabId: this.props.tabId,
      constants: constants,
      actions: actions
    });
  },

  /**
   * /recording
   * Displays the recording interface with the current assignment when signed
   * in and recording the current tab.
   */
  recording: function () {
    logger.info('recording:', { props: this.props });
    return Recording({
      tabId: this.props.tabId,
      node: this.props.node,
      assignment: this.props.assignment,
      constants: constants,
      actions: actions
    });
  },

  /**
   * /sign_in
   * Displays the sign in form when not signed in
   */
  signIn: function () {
    logger.info('signIn:', { props: this.props });
    return SignIn({
      tabId: this.props.tabId,
      constants: constants,
      actions: actions
    });
  }

});
