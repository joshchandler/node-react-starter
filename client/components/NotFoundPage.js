import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

import Header from './Header';

export default class NotFoundPage extends Component {
  render() {
    return (
      <div className="not-found">
        <Header />
        Page not found!
      </div>
    );
  }
}

NotFoundPage.propTypes = {
  
};