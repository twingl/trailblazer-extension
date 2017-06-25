import styles from '../style/main-ui.manifest.scss';
import markup from '../markup/offline-data.html';

import React from 'react';
import ReactDOM from 'react-dom';
import domready from 'domready';
import { Router, Route, Redirect, useRouterHistory } from 'react-router';
import { createHashHistory } from 'history';
import Actions from '../actions';

import Layout from '../components/layouts/main-ui.jsx';

import * as OfflineData from '../components/views/offline-data';

var routes = <Route component={Layout}>
  <Route path='/assignments' component={OfflineData.Index} actions={Actions} />
  <Route path='/assignments/:id' component={OfflineData.Show} actions={Actions} />

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
