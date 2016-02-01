import React    from 'react';
import ReactDOM from 'react-dom';
import domready from 'domready';
import { Router, Route, Redirect, useRouterHistory } from 'react-router';
import { createHashHistory } from 'history';

import Layout from '../components/layouts/tour.jsx';

import * as Tour from '../components/views/tour';

// Start tracking errors
import Raven from 'raven-js';
import { raven as config } from '../config';

if (config.url) Raven.config(config.url).install();

var routes = <Route component={Layout}>
  <Route path='/sign-in' component={Tour.SignIn} />
  <Route path='/step-1' component={Tour.Step1} />
  <Route path='/step-2' component={Tour.Step2} />
  <Route path='/step-3' component={Tour.Step3} />
  <Route path='/step-4' component={Tour.Step4} />
  <Route path='/step-5' component={Tour.Step5} />
  <Route path='/step-6' component={Tour.Step6} />
  <Route path='/step-7' component={Tour.Step7} />

  <Redirect from='/' to='/sign-in' />
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
