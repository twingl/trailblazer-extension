(function () {
  'use strict';

  /** @deprecated */
  var activityLog = [];

  /** @deprecated */
  var previousTabId = undefined;

  /** @deprecated */
  var currentTabId = undefined;

  var actions = {
    getLog: function() {
      return { nodes: stateManager.nodes };
    }
  };

  var stateManager = new StateManager({
    api: {
      host: "https://app.trailblazer.io",
      nameSpace: "api",
      version: "v1",
      clientId: "a2042d508750087699fc5651f442dc6534fb8222125c29aba91b2c71d49e7061"
    },
    eventAdapter:    ChromeEventAdapter,
    identityAdapter: ChromeIdentityAdapter
  });

  stateManager.signIn().then(
      function(r) { console.log("resolve", r); },
      function(r) { console.log("reject", r); });

  console.log(stateManager);


  chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log(request);
    switch (request.action) {
      case 'getLog':
        sendResponse({ data: actions.getLog() });
        break;
    }
  });

})();
