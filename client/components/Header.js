import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

export default class Header extends Component {
  render() {
    return (
      <div className="header">
      <ul>
        <li><Link to="home">Home</Link></li>
        <li><Link to="login">Login</Link></li>
        <li><Link to="register">Register</Link></li>
      </ul>
      </div>
    );
  }
}

Header.propTypes = {
  
};