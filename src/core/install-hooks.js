var ChromeIdentityAdapter = require('../adapter/chrome_identity_adapter')
  , actions = require('../actions');


module.exports = function(details) {
  switch(details.reason) {
    case "update":
      var identity = new ChromeIdentityAdapter();
      identity.getToken().then(function(token) {
        identity.storeToken(token);
      });
      actions.extensionUpdated(details.previousVersion);
      break;

    case "install":
      // Show onboarding
      chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/welcome.html") });
      actions.extensionInstalled();
      break;

    case "chrome_update":
      actions.chromeUpdated();
      break;
  }
};
