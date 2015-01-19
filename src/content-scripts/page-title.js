var actions = require('../actions')
  , domready = require('domready');

domready(function() {
  var title = document.title
    , url   = window.location.href;

  var payload = {
    title: title,
    url: url
  };

  chrome.runtime.sendMessage({
    type: "content_script",
    role: "title",
    payload: payload
  });
});
