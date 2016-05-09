import React from 'react';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../util/send-page-title';

export default class Step4 extends React.Component {

  onCloseClicked(evt) {
    evt.stopPropagation();

    actions.completedOnboardingStep(constants.onboarding.STEP_4)
    chrome.tabs.getCurrent(tab => chrome.tabs.remove(tab.id));
  }

  componentDidMount() {
    sendPageTitle();
  }

  render() {
    return <div className="tour--step-4">

      <Helmet title='Safe and Sound' />

      <h1>Safe and sound</h1>

      <p>Diversions and multitasking are taken care of.</p>

      <div className="btn-group task">
        <p>
          Tabs you open when Trailblazer is active will also be added to your
          trail.<br /> In those tabs, the icon will be orange too.
        </p>
        <a className="btn primary" onClick={this.onCloseClicked.bind(this)}>Safely close this tab</a>
      </div>
    </div>;
  }

};
