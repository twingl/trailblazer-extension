var _                     = require('lodash')
  , React                 = require('react')
  , router                = require('react-mini-router')
  , actions               = require('../actions')
  , ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , constants             = require('../constants')
  , Logger                = require('../util/logger');

var logger = new Logger('content/app.js');

//components
var AssignmentsIndex = React.createFactory(require('../components/content/assignments-index'));
var AssignmentsShow  = React.createFactory(require('../components/content/assignments-show'));

//setup routes
var RouterMixin     = router.RouterMixin
  , navigate        = router.navigate;

module.exports = React.createClass({
  mixins: [ RouterMixin ],
  routes: {
    '/':                'assignmentsIndex',
    '/assignments':     'assignmentsIndex',
    '/assignments/:id': 'assignmentsShow'
  },

  defaultRoute: function() {
    navigate('/assignments');
  },

  render: function () {
    logger.info('render: Rendering with props', { props: this.props });
    return this.renderCurrentRoute();
  },

  componentDidMount: function () {
    logger.info('componentDidMount:', { props: this.props });

    new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
      if (signedIn) {
        actions.requestTabState(this.props.tabId);
      } else {
        navigate('/sign_in');
      }
    }.bind(this));
  },


  /**
   * Assignments#index - borrowing naming conventions from Rails
   */
  assignmentsIndex: function () {
    logger.info('assignmentsIndex:', { props: this.props, state: this.state });
    return AssignmentsIndex({ actions });
  },

  /**
   * Assignments#show - borrowing naming conventions from Rails
   */
  assignmentsShow: function (localId) {
    var localId = parseInt(localId);

    logger.info('assignmentsShow:', { props: this.props, state: this.state });

    logger.debug(localId);

    return AssignmentsShow({
      localId: localId,
      actions: actions,
      constants: constants
    });
  }
});
