import React from 'react';
import { Link } from 'react-router';

export default class Header {
  
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
