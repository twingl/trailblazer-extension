var $         = require('jquery')
  , actions   = require('../actions')
  , constants = require('../constants');

var revealNextStep = function () {
  $('.action-group').addClass('fulfilled');
};

// When we receive a notification of the map being viewed, advance
chrome.runtime.onMessage.addListener( function (msg) {
  if (msg.action === constants.STOP_RECORDING_SUCCESS) revealNextStep();
});

$(document).ready( revealNextStep );
