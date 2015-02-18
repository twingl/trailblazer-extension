var $         = require('jquery')
  , constants = require('../constants')
  , actions   = require('../actions');

$(document).ready( function () {
  $('#btnClose').click( function (evt) {

    actions.completedOnboardingStep(constants.onboarding.STEP_4)

    evt.stopPropagation();

    chrome.tabs.getCurrent( function (tab) {
      chrome.tabs.remove(tab.id);
    });
  });
});
