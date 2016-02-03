import React from 'react';
import Helmet from 'react-helmet';

import actions from '../../../actions';
import constants from '../../../constants';
import Identity from '../../../adapter/chrome_identity_adapter';

import { sendPageTitle } from '../../../util/send-page-title';

class SignIn extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      signedIn: undefined
    }
  }

  onMessage(msg) {
    if (msg.action === constants.SIGN_IN_SUCCESS) this.revealNextStep();
  }

  componentDidMount() {
    //Page title
    this.__messageHandler = this.onMessage.bind(this);
    chrome.runtime.onMessage.addListener(this.__messageHandler);

    new Identity().isSignedIn().then((signedIn) => {
      if (signedIn) {
        this.revealNextStep();
      } else {
        this.setState({ signedIn: false });
      }
    });

    sendPageTitle();
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.__messageHandler);
  }

  revealNextStep() {
    // Navigate
    this.context.router.push('/step-1');
  }

  onSignInClicked(evt) {
    evt.preventDefault();

    // Launch the combined sign in/up flow through flux
    actions.signIn();
  }

  render() {
    if (typeof this.state.signedIn === "undefined") {
      return <div></div>;
    } else {
      return <div className='tour--sign-in'>

        <Helmet title='Sign In' />

        <h1>Installation complete!</h1>

        <p>That's the first step out of the way.</p>
        <p>To keep your data safe and sound, you'll need to sign in below.</p>

        <div className="btn-group task">
          <p className="aside">If you're new to Trailblazer, we'll just need your email address and a new password to get you signed up.</p>
          <a onClick={this.onSignInClicked.bind(this)} className="btn primary" href="#">Sign Up</a>
          <a onClick={this.onSignInClicked.bind(this)} className="secondary" href="#">Already have an account? Sign In</a>
        </div>
      </div>;
    }
  }

};

SignIn.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default SignIn;
