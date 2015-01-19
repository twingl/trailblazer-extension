var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter');

module.exports = function(details) {
  switch(details.reason) {
    case "update":
      // Do stuff
      var identity = new ChromeIdentityAdapter();
      identity.getToken().then(function(token) {
        identity.storeToken(token);
      });
      break;
    case "install":
      // Show onboarding
      chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/welcome.html") });
      break;
    case "chrome_update":
      //
      break;
  }
};
