import ChromeIdentityAdapter from '../adapter/chrome_identity_adapter';
import actions from '../actions';


export default function(details) {
  switch(details.reason) {
    case "update":
      var identity = new ChromeIdentityAdapter();
      identity.getToken().then(token => identity.storeToken(token));
      actions.extensionUpdated(details.previousVersion);
      break;

    case "install":
      // Show onboarding
      chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/build/tour/sign-in.html") });
      actions.extensionInstalled();
      break;

    case "chrome_update":
      actions.chromeUpdated();
      break;
  }
};
