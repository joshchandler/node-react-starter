import React from 'react';
import { Link } from 'react-router';

import Header from '../Header';

export default class NotFound {

  render() {
    return (
      <div className="not-found">
        <Header />
        Page not found!!
      </div>
    );
  }
}