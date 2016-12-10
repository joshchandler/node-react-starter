import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import Header from './Header';

export default class LoginPage extends Component {
  render() {

    return (
      <div className="login">
        <Header />
        So, you want to login.
      </div> 
    );
  }
}

LoginPage.propTypes = {
  
};