import _ from 'lodash';
import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import logger from 'morgan';
import slashes from 'connect-slashes';
import crypto from 'crypto';
import path from 'path';

import cacheControl from './cache-control';

import routes from '../routes';
import ConfigManager from '../config';
import utils from '../utils';

let config = ConfigManager.config;

export const middleware = {
  cacheControl: cacheControl
};

export default function setupMiddleware(appInstance) {
  const logging = config.logging;
  const corePath = config.paths.corePath;

  // silence JSHint without disabling unused check for the whole file

  // Cache express server instance
  let app = appInstance;

  // Make sure 'req.secure' is valid for proxied requests
  // (X-Forwarded-Proto header will be checked, if present)
  app.enable('trust proxy');
  
  // Logging configuration
  if (logging !== false) {
    if (app.get('env') !== 'development') {
      app.use(logger('combined', logging));
    } else {
      app.use(logger('dev', logging));
    }
  }
  
  // Static assets
  // app.use('/content/images', storage.getStorage().serve());
  // app.use('/public', express['static'](config.paths.publicPath, {maxAge: utils.ONE_YEAR_MS}));
  if (process.env.NODE_ENV === ('production' || 'staging')) {
    app.use('/public', express.static(config.paths.publicPath, {maxAge: utils.ONE_YEAR_MS}));
  } else {
    app.use('/public', express.static(config.paths.publicPath));
  }
  
  app.set('views', config.paths.templatesPath);
  
  // Add in all trailing slashes
  app.use(slashes(true, {
    headers: {
      'Cache-Control': 'public, max-age=' + utils.ONE_YEAR_S
    }
  }));

  // Body parsing
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  
  // ### Caching
  // Frontend is cacheable
  app.use(middleware.cacheControl('private'));

  // Set up Frontend routes
  app.use(routes.frontend(middleware));
}
