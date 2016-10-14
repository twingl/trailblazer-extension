import React from 'react';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../util/send-page-title';

class Step5 extends React.Component {

  revealNextStep() {
    actions.completedOnboardingStep(constants.onboarding.STEP_5);
    this.context.router.push('/step-6');
  }

  onMessage(msg) {
    if (msg.action === constants.RANK_NODE_WAYPOINT) this.revealNextStep();
  }

  componentDidMount() {
    this.__messageHandler = this.onMessage.bind(this);
    chrome.runtime.onMessage.addListener(this.__messageHandler);

    sendPageTitle();
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.__messageHandler);
  }

  render() {
    return <div className="tour--step5">

      <Helmet title='Favouriting' />

      <h1>Welcome back</h1>

      <p>Now that we've got that extra tab under control, let's talk about something called Favouriting.</p>

      <div className="task">
        <p>When you come across something you find important, you can make it stand out.</p>

        <p>Give it a try now: Tap the Trailblazer icon <span className="trailblazer-button"></span> and Favourite <span className="waypoint-button"></span> this page</p>
      </div>
    </div>;
  }

};

Step5.contextTypes = {
  router: React.PropTypes.object.isRequired
}

export default Step5;
