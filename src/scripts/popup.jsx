import React from 'react';
import ReactDOM from 'react-dom';
import domready from 'domready';

import Actions from '../actions';

import Layout from '../components/layouts/popup.jsx';

// Start tracking errors
import Raven from 'raven-js';
import { raven as config } from '../config';

if (config.url) Raven.config(config.url).install();

domready(() => {
  let container = document.getElementById('container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);
  }

  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    ReactDOM.render(<Layout actions={Actions} tabId={tabs[0].id} />, container);
  });
});
