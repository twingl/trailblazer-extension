var $         = require('jquery')
  , actions   = require('../actions')
  , constants = require('../constants');

var revealNextStep = function () {
  actions.completedOnboardingStep(constants.onboarding.STEP_6);
  window.location.href = chrome.runtime.getURL('/build/tour/7.html');
};

// When we receive a notification of the map being viewed, advance
chrome.runtime.onMessage.addListener( function (msg) {
  if (msg.action === constants.VIEWED_MAP) revealNextStep();
});
