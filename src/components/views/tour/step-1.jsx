import React from 'react';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../util/send-page-title';

class Step1 extends React.Component {

  revealNextStep() {
    actions.completedOnboardingStep(constants.onboarding.STEP_1);
    this.context.router.push('/step-2');
  }

  onMessage(msg) {
    if (msg.action === constants.START_RECORDING_SUCCESS) {
      this.revealNextStep();
    }

    if (msg.action === constants.REQUEST_TAB_STATE_RESPONSE
        && msg.payload.state.recording === true) {
      this.revealNextStep();
    }
  }

  componentDidMount() {
    this.__messageHandler = this.onMessage.bind(this);
    chrome.runtime.onMessage.addListener(this.__messageHandler);

    // Check if we're already recording
    chrome.tabs.getCurrent((tab) => {
      actions.requestTabState(tab.id);
    });

    sendPageTitle();
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.__messageHandler);
  }

  render() {
    return <div className="tour--step-1">

      <Helmet title='Activating Trailblazer' />

      <h1>Let's start making a trail</h1>

      <p>To get the most out of Trailblazer, it's good to start the trail before you start browsing.</p>

      <p className="task">Tap on the Trailblazer Icon <span className="trailblazer-button idle"></span> in your browser toolbar.<br />(it's up in the top right corner)</p>
      <p className="task">
        Activate Trailblazer by tapping the activate button 
        <span className="record-button"></span>
      </p>
    </div>
  }

};

Step1.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Step1;
