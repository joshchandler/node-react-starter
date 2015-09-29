import path from 'path';
import Promise from 'bluebird';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import url from 'url';
import _ from 'lodash';
import knex from 'knex';
import validator from 'validator';
import logging from 'winston';
import configFile from '../../config';

const appRoot = path.resolve(__dirname, '../../');
const corePath = path.resolve(appRoot, 'core/');

let defaultConfig = {};
let knexInstance;


function configureDriver(client) {
  let pg;
  
  if (client === ('pg' || 'postgres' || 'postgresql')) {
    try {
      pg = require('pg');
    } catch (e) {
      pg = require('pg.js');
    }
    
    // By default PostgreSQL returns data as strings along with an OID that identifies
    // its type.  We're setting the parser to convert OID 20 (int8) into a javascript
    // integer.
    pg.types.setTypeParser(20, (val) => {
      return val === null ? null : parseInt(val, 10);
    });
  }
}

class ConfigManager {
  constructor() {
    // Must first initiate the config Object
    this.config = {};
    
    // Set the config object
    this.set();
  }
  
  init() {
    const self = this;
    
    self.set();
    
    return self.config;
  }
  
  /**
  * Sets the config object depending on the node environment.
  * @param {Object} config Only accepts an object.
  */
  set(config) {
    // The node environment or 'development' if none is set
    const environment = process.env.NODE_ENV || 'development';
    
    config = config || {};
    
    let coreConfig = configFile.core;
    let devConfig = configFile.development;
    let stagingConfig = configFile.staging;
    let testingConfig = configFile.testing;
    let prodConfig = configFile.production;
    
    // Merge core settings to the config object.
    _.merge(this.config, coreConfig);
    
    // Merge environment specific settings to the config object.
    if (environment === 'production') {
      _.merge(this.config, prodConfig);
    } else if (environment === 'staging') {
      _.merge(this.config, stagingConfig);
    } else if (environment === 'testing') {
      _.merge(this.config, testingConfig);
    } else {
      _.merge(this.config, devConfig);
    }
    
    // Database configuration
    configureDriver(this.config.database.client);
    try {
      knexInstance = knex(this.config.database);
    } catch (e) {
      console.error('Couldn\'t connect to database in config');
    }
    
    _.merge(this.config, {
      database: {
        knex: knexInstance
      }
    });
    
    // If an object is passed in, merge it.
    _.merge(this.config, config);
    
    return this.config;
  }
  
  /**
   * Allows you to read the config object.
   * @return {Object} The config object.
   */
  get() {
    return this.config;
  }
  
  load() {
    const self = this;
    // Validate that our config object has the correct settings
    // After that, start the server.
    return new Promise((resolve, reject) => {
      Promise.resolve(self.config).then(() => {
        return self.validate();
      }).then(() => {
        resolve(self.init());
      }).catch(reject);
    });
  }
  
  /**
   * Validates the config object has everything we want and in the form we want.
   * @return {Promise.<Object>} Return a promise that resolves to the config object.
   */
  validate() {
    let envVal = process.env.NODE_ENV || undefined;
    let hasHostAndPort;
    let hasSocket;
    let config;
    let parsedUrl;
  
    // @todo: Validation statements
  
    return Promise.resolve(this.config);
  }
  
  getSocket() {
    let socketConfig;
    let values = {
      path: path.join(this.config.paths.appRoot, process.env.NODE_ENV + '.socket'),
      permissions: '660'
    };
    
    if (this.config.server.hasOwnProperty('socket')) {
      socketConfig = this.config.server.socket;
      
      if (_.isString(socketConfig)) {
        values.path = socketConfig;
        
        return values;
      }
      
      if (_.isObject(socketConfig)) {
        values.path = socketConfig.path || values.path;
        values.permissions = socketConfig.permissions || values.permissions;
        
        return values;
      }
    }
    
    return false;
  }
}

export default new ConfigManager();