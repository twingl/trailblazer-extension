var $         = require('jquery')
  , constants = require('../constants')
  , actions   = require('../actions');

// Any event handlers go in here
$(document).ready( function () {
  $('#continue').click( function () {
    actions.completedOnboardingStep(constants.onboarding.STEP_2);
  });
});
