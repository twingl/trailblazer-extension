(function($) {
  $(document).ready(function () {

    /**
     * Click handler for any elements that intend to open the map interface
     */
    $('.open-map').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({ action: "getCurrentAssignment" }, function(response) {
        chrome.runtime.sendMessage({
          action: "trackUIEvent",
          eventName: "ui.popup.map.click",
          eventData: {
            assignmentId: response.id || false
          }
        });

        // Open the map in a new tab
        chrome.tabs.create({ url: chrome.extension.getURL("/ui/pages/map.html#assignment=" + (response.id || false) ) });
      });
    });

  });
}(window.jQuery));
