var extensionStates = require('../core/extension-states');

module.exports = function(evt) {
  extensionStates.currentTabId = evt.data.tabId;
};