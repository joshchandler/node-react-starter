import express from 'express';
import hbs from 'express-hbs';
import compress from 'compression';
import fs from 'fs';
import uuid from 'node-uuid';
import _ from 'lodash';
import bodyParser from 'body-parser';
import logger from 'morgan';
import slashes from 'connect-slashes';

import ConfigManager from './config';
import middleware from './middleware';
import Server from './server';
import models from './models';
import mailer from './mail';
import api from './api';

import React from 'react';
import Router from 'react-router';
import routes from '../client/routes';

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
    // Initialize mail
    return mailer.init();
  }).then(() => {
    var appHbs = hbs.create();
		const logging = config.logging;
		const corePath = config.paths.corePath;

		// Strict routing
		app.enable('strict routing');

		// Add in all trailing slashes
		app.use(slashes(false));

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
    // middleware(app);

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


		// Body parsing
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));

		// ### Caching
		// Frontend is cacheable
		// app.use(middleware.cacheControl('private'));

		// Register the API
		api(app);

		app.use((req, res, next) => {
			let router = Router.create({location: req.url, routes: routes});
			router.run((Handler, state) => {
				let html = React.renderToString(<Handler />);
				return res.render('frontend', {
					html: html,
					req: req,
				});
			});
		});

		return new Server(app);
  }).catch((err) => {
    logger.error(err);
  });
};
