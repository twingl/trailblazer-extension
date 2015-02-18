var $         = require('jquery')
  , actions   = require('../actions')
  , constants = require('../constants');

var revealNextStep = function () {
  actions.completedOnboardingStep(constants.onboarding.STEP_5);
  window.location.href = chrome.runtime.getURL('/build/tour/6.html');
};

// When we receive a notification of the waypoint action being made advance to
// the next step
chrome.runtime.onMessage.addListener( function (msg) {
  if (msg.action === constants.RANK_NODE_WAYPOINT) revealNextStep();
});
