var _                     = require('lodash')
  , React                 = require('react')
  , router                = require('react-mini-router')
  , actions               = require('../actions')
  , ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , constants             = require('../constants')
  , info                  = require('debug')('content/app.js:info');

//components
var AssignmentsIndex = React.createFactory(require('app/components/content/assignments-index'));
var AssignmentsShow  = React.createFactory(require('app/components/content/assignments-show'));

//setup routes
var RouterMixin     = router.RouterMixin
  , navigate        = router.navigate;

module.exports = React.createClass({
  mixins: [ RouterMixin ], 
  routes: {
    '/':                'defaultRoute',
    '/assignments':     'assignmentsIndex',
    '/assignments/:id': 'assignmentsShow'
  },

  defaultRoute: function() {
    navigate('/assignments');
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
          if (message.storeName === "AssignmentStore" &&
              message.payload.assignments) {
            console.log("setting assignments: ", { assignments: message.payload.assignments });
            this.setState({ assignments: message.payload.assignments });
          }

          if (message.storeName === "AuthenticationStore" &&
              message.payload.authenticated !== true) {
            // Show a sign in page
          }
      }
    }.bind(this));

    new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
      if (signedIn) {
        actions.requestTabState(this.props.tabId);
      } else {
        navigate('/sign_in');
      }
    }.bind(this));

    actions.requestAssignments();
  },


  /**
   * Assignments#index - borrowing naming conventions from Rails
   */
  assignmentsIndex: function () {
    info('assignmentsIndex:', { props: this.props, state: this.state });

    return AssignmentsIndex({
      assignments: this.state.assignments,
      actions: actions
    });
  },

  /**
   * Assignments#show - borrowing naming conventions from Rails
   */
  assignmentsShow: function (localId) {
    info('assignmentsShow:', { props: this.props, state: this.state });
    var assignment = this.state.assignments[localId];

    return AssignmentShow({
      assignment: this.state.assignment,
      actions: actions
    });
  }
});
