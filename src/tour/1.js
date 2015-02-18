var $         = require('jquery')
  , actions   = require('../actions')
  , constants = require('../constants');

var revealNextStep = function () {
  actions.completedOnboardingStep(constants.onboarding.STEP_1);
  window.location.href = chrome.runtime.getURL('/build/tour/2.html');
};

// When we receive a notification of recording starting successfully, show the
// continue button
chrome.runtime.onMessage.addListener( function (msg) {
  if (msg.action === constants.START_RECORDING_SUCCESS) revealNextStep();
  if (msg.action === constants.REQUEST_TAB_STATE_RESPONSE
      && msg.payload.state.recording === true) {
    revealNextStep();
  }
});

chrome.tabs.getCurrent( function (tab) {
  actions.requestTabState(tab.id);
});
