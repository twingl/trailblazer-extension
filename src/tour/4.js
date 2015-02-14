var $ = require('jquery');

$(document).ready( function () {
  $('#btnClose').click( function (evt) {

    evt.stopPropagation();

    chrome.tabs.getCurrent( function (tab) {
      chrome.tabs.remove(tab.id);
    });
  });
});
