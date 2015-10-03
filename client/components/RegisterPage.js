import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import Header from './Header';
import Footer from './Footer';
import App from './App';

export default class RegisterPage extends Component {
  
  render() {
    return (
      <div className="register">
        <Header />
        Register Here!!
        <form>
          <input type="text" placeholder="Username" />
        </form>
        <Footer />
      </div> 
    );
  }
}

RegisterPage.propTypes = {
  
};