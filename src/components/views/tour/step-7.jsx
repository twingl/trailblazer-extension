import React from 'react';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../util/send-page-title';

export default class Step7 extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      fulfilled: false
    };
  }
  
  revealNextStep() {
    actions.completedOnboardingStep(constants.onboarding.STEP_7);
    this.setState({ fulfilled: true });
  }

  onMessage(msg) {
    if (msg.action === constants.STOP_RECORDING_SUCCESS) this.revealNextStep();
  }

  componentDidMount() {
    this.__messageHandler = this.onMessage.bind(this);
    chrome.runtime.onMessage.addListener(this.__messageHandler);

    window.twttr.widgets.createShareButton(
      "http:\/\/www.trailblazer.io\/",
      document.getElementById('twitter-share-button'),
      {
        related: "TrailblazerApp,LetsTwingl",
        text: "I just made my first trail using @TrailblazerApp",
        dnt: true
      }
    );

    window.twttr.events.bind('click', () => {
      actions.completedOnboardingStep(constants.onboarding.STEP_7_TWEET);
    });

    sendPageTitle();
  }

  componentWillUnmount() {
    chrome.runtime.onMessage.removeListener(this.__messageHandler);
  }

  render() {
    let className = '';

    if (this.state.fulfilled) {
      className = 'fulfilled'
    }

    return <div className={`action-group tour--step-7 ${className}`}>

        <Helmet title='Finishing Up' />

        <div className="request">
          <h1>Congratulations!</h1>

          <p>
            You've just made your first trail! <span id="twitter-share-button"></span>
          </p>

          <p>There's just one small thing left.</p>

          <div className="task">
            <p>When you're done exploring, it's a good idea to stop Trailblazer.</p>

            <p>Try it now: Tap the Trailblazer icon <span className="trailblazer-button recording"></span> and press stop <span className="stop-button"></span></p>
          </div>
        </div>

        <div className="fulfilled">
          <h1>Well done!</h1>

          <p>Now go out into the world wide web and indulge your curiosity and share your journey with others as you go.</p>

          <h2>Good things to know</h2>

          <p className="task">
            See your previous trails by tapping the Trailblazer icon <span className="trailblazer-button"></span> and tapping the folder <span className="folder-icon"></span>.
          </p>

          <p className="task">
            When viewing a previous trail, just tap any node to resume from that point.<br />
            Trailblazer will open a new tab and automatically activate.
          </p>
        </div>
      </div>;
  }

};
