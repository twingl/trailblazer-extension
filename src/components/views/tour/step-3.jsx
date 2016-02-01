import React from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../content-scripts/page-title';

class Step3 extends React.Component {

  onContinueClicked() {
    actions.completedOnboardingStep(constants.onboarding.STEP_3)

    // Sneakily navigate to the next step in the background
    window.setTimeout(() => {
      this.context.router.push('/step-5');
    }, 200);

    // The click event will propagate out to the browser's default action
    // with _blank links, so hopefully popups aren't blocked and then we'll
    // get a new tab.
  }

  componentDidMount() {
    sendPageTitle();
  }

  render() {
    return <div className="tour--step-3">

      <Helmet title='Still Activated' />

      <h1>Set and forget</h1>

      <p>See how the icon is still orange? Trailblazer is still active.</p>

      <div className="btn-group task">
        <p>
          When you turn it on, Trailblazer will keep track of what you do in
          this tab and automagically add it to your trail.
        </p>
        <Link className="btn primary" target="_blank" to='/step-4' onClick={this.onContinueClicked.bind(this)}>Continue</Link>
      </div>
    </div>
  }

};

Step3.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Step3;
