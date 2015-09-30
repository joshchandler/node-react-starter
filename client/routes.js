import React from 'react';
import { Route, DefaultRoute, NotFoundRoute } from 'react-router';

import App from './components/App';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import NotFoundPage from './components/NotFoundPage';


export default (
  <Route name="home" path="/">
    /** Home Page */
    <DefaultRoute handler={App} />
    
    /** Authentication Pages */
    <Route name="login" path="login/" handler={LoginPage} />
    <Route name="register" path="register/" handler={RegisterPage} />
    
    /** 404 Page **/
    <NotFoundRoute handler={NotFoundPage} />
  </Route>
);
