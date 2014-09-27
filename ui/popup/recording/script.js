(function($) {
  $(document).ready(function () {

    /**
     * Click handler for telling the extension to stop recording a tab
     */
    $('.stop-recording').click(function(evt) {
      // Prevent the default action
      evt.preventDefault();

      chrome.runtime.sendMessage({
        action: "trackUIEvent",
        eventName: "ui.popup.break.click",
        eventData: { }
      });

      // Request that the node stop being recorded
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];

        chrome.runtime.sendMessage({ action: "stopRecording", tabId: tab.id }, function() {
          window.location.href = "/ui/popup/idle.html";
        });
      });
    });

  });
}(window.jQuery));
