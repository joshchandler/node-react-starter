import express from 'express';
import hbs from 'express-hbs';
import compress from 'compression';
import fs from 'fs';
import uuid from 'node-uuid';
import _ from 'lodash';
import logger from 'winston';

import ConfigManager from './config';
import middleware from './middleware';
import Server from './server';
import models from './models';
import migration from './models/migration';
import mailer from './mail';

let config = ConfigManager.config;

/**
 * Initialize the Server
 */
export default () => {
  let app = express();

  // # Initialization
  // The server and its dependencies require a populated config
  // It returns a promise that is resolved when the application
  // has finished starting up.
  
  // Load our config object.
  return ConfigManager.load().then(() => {
    // Initialize our models
    return models.init();
  }).then(() => {
    // Initialize migration
    return migration.init();
  }).then(() => {
    // Initialize mail
    return mailer.init();
  }).then(() => {
    var appHbs = hbs.create();
    
    // return the correct mime type for woff files
    express['static'].mime.define({'application/font-woff': ['woff']});
    
    // enabled gzip compression by default
    if (config.server.compress !== false) {
      app.use(compress());
    }
    
    // ## View engine
    // set the view engine
    app.set('view engine', 'hbs');
    app.engine('hbs', appHbs.express4({}));
    
    // Handles express server and routing
    middleware(app);
    
    return new Server(app);
  }).catch((err) => {
    logger.error(err);
  });
};
