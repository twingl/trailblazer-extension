(function($) {
  $(document).ready(function () {

    /**
     * Click handler for any elements that intend to sign the user out of
     * Trailblazer
     */
    $('.logout').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.popup.signout.click",
        eventData: { }
      });

      // Request that we be signed out
      chrome.runtime.sendMessage({ action: "signOut" }, function(success) {
        // When we hear that it was successful, navigate to the unauth view
        if (success) {
          window.location.href = "/ui/popup/not_authenticated.html";
        }
      });
    });

    /**
     * Click handler for any elements that intend to sign the user into
     * Trailblazer
     */
    $('.login').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.popup.signin.click",
        eventData: { }
      });

      // Request that we be signed in
      chrome.runtime.sendMessage({ action: "signIn" }, function(success) {
        // When we hear that it was successful, navigate to the idle view
        if (success) {
          window.location.href = "/ui/popup/idle.html";
        }
      });
    });

    /**
     * Click handler for the extension how-to
     */
    $('.tutorial').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      // Open the map in a new tab
      chrome.tabs.create({ url: evt.target.href });
    });


  });
}(window.jQuery));
