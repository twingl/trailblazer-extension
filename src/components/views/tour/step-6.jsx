import React from 'react';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../content-scripts/page-title';

export default class Step6 extends React.Component {

  revealNextStep() {
    actions.completedOnboardingStep(constants.onboarding.STEP_6);
    this.context.router.push('/step-7');
  }

  // When we receive a notification of the map being viewed, advance
  onMessage(msg) {
    if (msg.action === constants.VIEWED_MAP) this.revealNextStep();
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
    return <div className="tour--step-6">

      <Helmet title='The Map' />

      <h1>Map time</h1>

      <p>Now let's take a look at the trail you've started, and see how it's growing</p>

      <p className="task">Just open the menu again and tap "View Trail"</p>
    </div>;
  }

};

Step6.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Step6;
