var $ = require('jquery');

$(document).ready( function () {
  $('#btnClose').click( function () {
    chrome.tabs.getCurrent( function (tab) {
      chrome.tabs.remove(tab.id);
    });
  });
});
