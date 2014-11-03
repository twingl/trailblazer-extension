var getNode = require('./get-node');

module.exports = function(tabId) {
  getNode(tabId).recording = false;
};