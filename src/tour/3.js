var $ = require('jquery');

$(document).ready( function () {
  $('#btnContinue').click( function () {
    // Sneakily navigate to the next step in the background
    window.setTimeout( function () {
      window.location.href = chrome.runtime.getURL('/build/tour/5.html');
    }, 200);

    // The click event will propagate out to the browser's default action
    // with _blank links, so hopefully popups aren't blocked and then we'll
    // get a new tab.
  });
});
