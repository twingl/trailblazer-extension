(function($) {
  $(document).ready(function () {

    /**
     * Click handler for telling the extension to start recording a tab
     */
    $('.start-recording').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.popup.record.click",
        eventData: { }
      });

      // Request that we start recording this tab
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];

        chrome.runtime.sendMessage({ action: "startRecording", tabId: tab.id }, function() {
          window.location.href = "/ui/popup/recording.html";
        });
      });
    });

    /**
     * Click handler for creating a new tab to display trails
     */
    $('.folder-view-trails').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.popup.trails.click",
        eventData: { }
      });

      // Open new tab showing list of assignments
      chrome.tabs.create({ url: "/ui/pages/trails.html" });
    });

  });
}(window.jQuery));
