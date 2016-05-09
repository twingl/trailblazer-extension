import React from 'react';
import Classnames from 'classnames';

import Constants from '../../../constants';

class SignIn extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      working: false,
      buttonText: 'Sign In'
    };
  }

  onSignInClicked(evt) {
    if (this.state.working) return;

    // Set the working flag so the spinner shows on update
    var buttonText = this.state.buttonText;
    this.setState({ working: true, buttonText: '' });

    // Set a timeout so if the call fails, the user can retry
    window.setTimeout(() => {
      this.setState({ buttonText, working: false });
    }, 10000);

    // Initiate the sign in process
    this.props.actions.signIn();
  }

  onTutorialClicked(evt) {
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour.html") });
  }

  render() {
    let classes = Classnames('login', 'button', 'sign-in', {
      'throbber': this.state.working
    });

    return <div className="wrap">
      <a className={classes}
          onClick={this.onSignInClicked.bind(this)}>
        {this.state.buttonText}
      </a>

      <a className="tutorial"
          title="How to use Trailblazer"
          onClick={this.onTutorialClicked.bind(this)}>

        <img src="/assets/icons/tutorial-icon.svg" />
      </a>
    </div>;
  }
};

export default SignIn;
