(function($) {
  $(document).ready(function () {

    /**
     * Click handler for any elements that intend to sign the user out of
     * Trailblazer
     */
    $('.logout').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

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

      // Request that we be signed in
      chrome.runtime.sendMessage({ action: "signIn" }, function(success) {
        // When we hear that it was successful, navigate to the idle view
        if (success) {
          window.location.href = "/ui/popup/idle.html";
        }
      });
    });

  });
}(window.jQuery));
