var React       = require('react/addons')
  , navigate    = require('react-mini-router').navigate;

module.exports = React.createClass({
  getDefaultProps: function() {
    return {
      working: false
    };
  },

  componentDidMount: function () {
    // Bind listener
    chrome.runtime.onMessage.addListener( function (message) {
      switch (message.action) {
        case this.props.constants.__change__:
          // AuthenticationStore changes
          if (message.payload.store === "AuthenticationStore" &&
              message.payload.authenticated === true) {
            navigate('/idle');
          }
          break;
      }
    }.bind(this));
  },

  onSignInClicked: function (evt) {
    if (this.props.working) return;

    var button = evt.currentTarget;

    // Set the working flag so the spinner shows on update
    this.props.working = true;
    var btnText = button.text;
    button.text = '';
    this.forceUpdate(); // Force the component to redraw

    // Set a timeout so if the call fails, the user can retry
    window.setTimeout(function() {
      this.props.working = false;
      button.text = btnText;
      this.forceUpdate(); // Force the component to redraw
    }.bind(this), 10000);

    // Initiate the sign in process
    this.props.actions.signIn();
  },

  onTutorialClicked: function (evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
  },

  render: function () {
    var classes = React.addons.classSet({
      'login':    true,
      'button':   true,
      'sign-in':  true,
      'throbber': this.props.working
    });

    return <div className="wrap">
      <a  className={classes}
          onClick={this.onSignInClicked}>
        Sign In
      </a>

      <a  className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }
});
