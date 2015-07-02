module.exports = {
  send: function(message) {
    chrome.runtime.sendMessage(message);
  },

  listen: function(listener) {
    chrome.runtime.onMessage.addListener(listener);
  }
}
