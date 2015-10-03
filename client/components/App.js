import React, { Component, PropTypes } from 'react';

import Header from './Header';
import Footer from './Footer';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <Header />
        Hello, World!
      </div> 
    );
  }
}

App.propTypes = {
  
};