import React from 'react/addons';
var navigate = require('react-mini-router').navigate;

class SignIn extends React.Component {

  componentDidMount() {
    // Bind listener
    chrome.runtime.onMessage.addListener((message) => {
      switch (message.action) {
        case this.props.constants.__change__:
          // AuthenticationStore changes
          if (message.payload.store === "AuthenticationStore" &&
              message.payload.authenticated === true) {
            navigate('/idle');
          }
          break;
      }
    });
  }

  onSignInClicked(evt) {
    if (this.props.working) return;

    var button = evt.currentTarget;

    // Set the working flag so the spinner shows on update
    this.props.working = true;
    var btnText = button.text;
    button.text = '';
    this.forceUpdate(); // Force the component to redraw

    // Set a timeout so if the call fails, the user can retry
    window.setTimeout(() => {
      this.props.working = false;
      button.text = btnText;
      this.forceUpdate(); // Force the component to redraw
    }, 10000);

    // Initiate the sign in process
    this.props.actions.signIn();
  }

  onTutorialClicked(evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
  }

  render() {
    var classes = React.addons.classSet({
      'login':    true,
      'button':   true,
      'sign-in':  true,
      'throbber': this.props.working
    });

    return <div className="wrap">
      <a  className={classes}
          onClick={this.onSignInClicked.bind(this)}>
        Sign In
      </a>

      <a  className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked.bind(this)}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }
};

SignIn.defaultProps = { working: false };

export default SignIn;
