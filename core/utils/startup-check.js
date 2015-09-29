import packages from '../../package.json';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import logging from 'winston';
import chalk from 'chalk';

const mode = process.env.NODE_ENV === undefined ? 'development' : process.env.NODE_ENV;
const appRoot = path.resolve(__dirname, '../../');

let checks = {
  check: function check() {
    this.nodeVersion();
    this.packages();
  },
  
  nodeVersion: function checkNodeVersion() {
    // Tell users if their node version is not supported, and exit
    try {
      const semver = require('semver');
      if (!semver.satisfies(process.versions.node, packages.engines.node)) {
        console.error('\x1B[31mERROR: Unsupported version of node/iojs');
        console.error('\x1B[31mThis Application needs Node version ' + packages.engines.node +
                      ' you are using version ' + process.versions.node);
        console.error('\x1B[32mPlease go to http://nodejs.org to get a supported version.\n');

        process.exit(0);
      }
    } catch (e) {
      return;
    }
  },

  // Make sure package.json dependencies have been installed.
  packages: function checkPackages() {
    if (mode !== 'production' && mode !== 'development') {
      return;
    }
    
    let errors = [];
    
    Object.keys(packages.dependencies).forEach((p) => {
      try {
        require.resolve(p);
      } catch (e) {
        errors.push(e.message);
      }
    });
    
    if (!errors.length) {
      return;
    }
    
    errors = errors.join('\n  ');
    
    console.error('\x1B[31mERROR: Unable to start due to missing dependencies:\n  ' + errors);
    console.error('\x1B[32m\nPlease run `npm install --production` and try starting again.');
    
    process.exit(0);
  }
};

export default checks;