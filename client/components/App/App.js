import React from 'react';
import { Link } from 'react-router';

import Header from '../Header';
import Footer from '../Footer';

export default class App {
  
  render() {
    return (
      <div className="App">
        <Header />
        Hello, World!
        <Footer />
      </div> 
    );
  }
}
