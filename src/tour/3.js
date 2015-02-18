var $         = require('jquery')
  , constants = require('../constants')
  , actions   = require('../actions');

$(document).ready( function () {
  $('#btnContinue').click( function () {
    actions.completedOnboardingStep(constants.onboarding.STEP_3)
    // Sneakily navigate to the next step in the background
    window.setTimeout( function () {
      window.location.href = chrome.runtime.getURL('/build/tour/5.html');
    }, 200);

    // The click event will propagate out to the browser's default action
    // with _blank links, so hopefully popups aren't blocked and then we'll
    // get a new tab.
  });
});
