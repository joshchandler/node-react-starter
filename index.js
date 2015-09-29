if (process.env.NODE_ENV === 'production') {
  require('newrelic');
}
require('babel/register');

// Make sure dependencies are installed and file system permissions are correct.
require('./core/utils/startup-check').check();

var express = require('express');
var errors = require('./core/errors');
var core = require('./core');

// Declare which environment we're in
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Express instance
var app = express();

/**
 * Loader
 * This loads the entire application
 * @returns {Promise<Object>}
 */
function loader(options) {
  options = options || {};
  
  return core(options);
}

loader().then(function (server) {
  // Start the server
  app.use(server.config.paths.subdir, server.rootApp);
  
  server.start(app);
}).catch(function (err) {
  errors.logErrorAndExit(err, err.context, err.help);
});