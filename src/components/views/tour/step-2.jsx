import React from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

import actions   from '../../../actions';
import constants from '../../../constants';

import { sendPageTitle } from '../../../content-scripts/page-title';

class Step2 extends React.Component {

  onContinueClicked(evt) {
    actions.completedOnboardingStep(constants.onboarding.STEP_2);
  }

  componentDidMount() {
    sendPageTitle();
  }

  render() {
    return <div className="tour--step-1">

      <Helmet title='Activated' />

      <h1>Liftoff</h1>

      <p>Great job! See how the icon turned orange? That means you're good to go.</p>

      <p>Cool huh?</p>

      <div className="btn-group task">
        <p>
          We've also given your trail a temporary name, so you don't have to
          worry about naming it up front. But if you want to, just tap the
          title and start typing.
        </p>
        <Link to='/step-3' onClick={this.onContinueClicked.bind(this)} className='btn primary'>Continue</Link>
      </div>
    </div>
  }

};

Step2.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default Step2;
