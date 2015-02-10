var $         = require('jquery')
  , actions   = require('../actions')
  , constants = require('../constants')
  , identity  = require('../adapter/chrome_identity_adapter');

var revealNextStep = function () {
  window.location.href = "/build/tour/1.html";
};

// When we receive a notification of successful sign in, reveal next step
chrome.runtime.onMessage.addListener( function (msg) {
  if (msg.action === constants.SIGN_IN_SUCCESS) revealNextStep();
});

// Check if we're signed in already, reveal next step if we are
new identity().isSignedIn().then( function (signedIn) {
  if (signedIn) {
    revealNextStep();
  } else {
    $(".wrap").show();
  }
});

var launchSignInFlow;
var launchSignUpFlow;

launchSignInFlow = launchSignUpFlow = function () {
  actions.signIn();
};

$(document).ready( function () {
  $('#btnSignIn').click(launchSignInFlow);
  $('#btnSignUp').click(launchSignUpFlow);
});
