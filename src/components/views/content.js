import _                     from 'lodash';
import React                 from 'react';
import router                from 'react-mini-router';
import actions               from '../../actions';
import ChromeIdentityAdapter from '../../adapter/chrome_identity_adapter';
import constants             from '../../constants';

import Logger from '../../util/logger';
var logger = Logger('content/app.js');

//components
var AssignmentsIndex = React.createFactory(require('./content/assignments-index'));
var AssignmentsShow  = React.createFactory(require('./content/assignments-show'));

//setup routes
var RouterMixin     = router.RouterMixin
  , navigate        = router.navigate;

export default React.createClass({
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
