/**
 * Makes a set of query functions available over Chrome's runtime messaging to
 * the UI.
 *
 * These are processed separately from the flux dispatcher, and behave like the
 * query functions that would be available on a store instance if the UI shared
 * the same memory as the background script.
 *
 * Queries are denoted by a list of function names on the class, set by the
 * @query decorator
 */
import Promise        from 'promise';
import stores         from './stores';
import _              from 'lodash';

var logger = Logger('queries.js');
import Logger from './util/logger';

var sendMessage = function(message) {
  return new Promise(function(resolve, reject) {

    var responder = function(...args) {
      if (!chrome.runtime.lastError) {
        resolve(...args);
      } else {
        reject(...args, chrome.runtime.lastError);
      }
    };

    chrome.runtime.sendMessage(message, responder);
  });
};

var exports = {};

_.each(stores, (store, name) => {
  if (store.queryFunctions) store.queryFunctions.map( (fn) => {
    exports[name] = exports[name] || {};

    exports[name][fn] = function(...args) {
      return sendMessage({
        query: fn,
        store: name,
        args: args
      });
    };
  })
});

export default exports;
