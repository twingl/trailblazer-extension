import React from 'react';
import ReactDOM from 'react-dom';
import domready from 'domready';
import { Router, Route, Redirect, useRouterHistory } from 'react-router';
import { createHashHistory } from 'history';
import Actions from '../actions';

import Layout from '../components/layouts/main-ui.jsx';

import * as Assignments from '../components/views/assignments';

// Start tracking errors
import Raven from 'raven-js';
import { raven as config } from '../config';

if (config.url) Raven.config(config.url).install();

var routes = <Route component={Layout}>
  <Route path='/assignments' component={Assignments.Index} actions={Actions} />
  <Route path='/assignments/:id' component={Assignments.Show} actions={Actions} />

  <Redirect from='/' to='/assignments' />
</Route>;

domready(() => {
  let container = document.getElementById('container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);
  }

  let appHistory = useRouterHistory(createHashHistory)({ queryKey: false });

  ReactDOM.render(<Router routes={routes} history={appHistory} />, container);
});
