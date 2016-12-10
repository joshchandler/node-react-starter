import _ from 'lodash';
import chalk from 'chalk';
import Promise from 'bluebird';
import path from 'path';

import ValidationError from './validation-error';

import ConfigManager from '../config';
const config = ConfigManager.config;

const errors = {
  throwError: (err) => {
    if (!err) {
      err = new Error('An error occurred');
    }
    
    if (_.isString(err)) {
      throw new Error(err);
    }
    
    throw err;
  },
  
  /**
   * Reject Error
   * Used to pass through promise errors when we want to handle them at a later time
   */
  rejectError: (err) => {
    return Promise.reject(err);
  },
  
  logInfo: (component, info) => {
    if (process.env.NODE_ENV === ('development' || 'staging' || 'production')) {
      console.info(chalk.cyan(component + ':', info));
    }
  },
  
  logWarn: (warn, context, help) => {
    if (process.env.NODE_ENV === ('development' || 'staging' || 'production')) {
      let msgs = [chalk.yellow('\nWarning:', warn), '\n'];
      
      if (context) {
        msgs.push(chalk.white(context), '\n');
      }
      
      if (help) {
        msgs.push(chalk.green(help));
      }
      
      // add a new line
      msgs.push('\n');
      
      console.log.apply(console, msgs);
    }
  },
  
  logError: (err, context, help) => {
    const self = this;
    let origArgs = _.toArray(arguments).slice(1);
    let stack;
    let msgs;
    
    if (_.isArray(err)) {
      _.each(err, (e) => {
        let newArgs = [e].concat(origArgs);
        errors.logError.apply(self, newArgs);
      });
      return;
    }
    
    stack = err ? err.stack : null;
    
    if (!_.isString(err)) {
      if (_.isObject(err) && _.isString(err.message)) {
        err = err.message;
      } else {
        err = 'An unknown error occurred.';
      }
    }
    
    // Overwrite error to provide information that this is probably a permission problem
    if (err.indexOf('SQLITE_READONLY') !== -1) {
      context = 'Your database is in read only mode.';
      help = 'Check your database file and make sure that file owner and permissions are correct.';
    }
    
    if (process.env.NODE_ENV === ('development' || 'staging' || 'production')) {
      msgs = [chalk.red('\nERROR:', err), '\n'];
      
      if (context) {
        msgs.push(chalk.white(context), '\n');
      }
      
      if (help) {
        msgs.push(chalk.green(help));
      }
      
      // add a new line
      msgs.push('\n');
      
      if (stack) {
        msgs.push(stack, '\n');
      }
      
      console.error.apply(console, msgs);
    }
  },
  
  logErrorAndExit: (err, context, help) => {
    this.logError(err, context, help);
    // Exit with 0 to prevent npm errors as we have our own
    process.exit(0);
  },
  
  logAndThrowError: (err, context, help) => {
    this.logError(err, context, help);
    
    this.throwError(err, context, help);
  },
  
  logAndRejectError: (err, context, help) => {
    this.logError(err, context, help);
    
    return this.rejectError(err, context, help);
  },
  
  logErrorWithRedirect: (msgs, context, help, redirectTo, req, res) => {
    const self = this;
    
    return () => {
      self.logError(msgs, context, help);
      
      if (_.isFunction(res.redirect)) {
        res.redirect(redirectTo);
      }
    }
  },
  
  // Load all other error handling functionality here.
  ValidationError: ValidationError
};

// Ensure our 'this' context for methods and preserve method arity by
// using Function#bind for express
_.each([
  'logWarn',
  'logInfo',
  'rejectError',
  'throwError',
  'logError',
  'logAndThrowError',
  'logAndRejectError',
  'logErrorAndExit',
  'logErrorWithRedirect'
], (funcName) => {
  errors[funcName] = errors[funcName].bind(errors);
});

export default errors;
