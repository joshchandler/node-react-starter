/*globals describe, before, beforeEach, afterEach, it*/
import should from 'should';
import sinon from 'sinon';
import express from 'express';
import rewire from 'rewire';
import _ from 'lodash';

// Stuff to test

import chalk from 'chalk';
import config from '../../core/config';
import errors from '../../core/errors';

let currentEnv = process.env.NODE_ENV || 'development';

describe('Error handling', () => {
  // Just getting rid of jslint unused error
  should.exist(errors);
  
  describe('Throwing', () => {
    it('throws error objects', () => {
      let toThrow = new Error('test1');
      let runThrowError = () => {
        errors.throwError(toThrow);
      };
      
      runThrowError.should['throw']('test1');
    });
    
    it('throws error strings', () => {
      let toThrow = 'test2';
      let runThrowError = () => {
        errors.throwError(toThrow);
      };
      
      runThrowError.should['throw']('test2');
    });
    
    it('throws error even if nothing passed', () => {
      let runThrowError = () => {
        errors.throwError();
      };
      
      runThrowError.should['throw']('An error occurred');
    });
  });
  
  describe('Warn Logging', () => {
    let logStub;
    // Can't use afterEach here, because mocha uses console.log to output the checkboxes
    // which we've just stubbed, so we need to restore it before the test ends to see ticks.
    let resetEnvironment = () => {
      logStub.restore();
      process.env.NODE_ENV = currentEnv;
    };
    
    beforeEach(() => {
      logStub = sinon.stub(console, 'log');
      process.env.NODE_ENV = 'development';
    });
    
    afterEach(() => {
      logStub.restore();
    });
    
    it('logs default warn with no message supplied', () => {
      errors.logWarn();
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.yellow('\nWarning: no message supplied'), '\n');
      
      // Future tests: This is important here!
      resetEnvironment();
    });
    
    it('logs warn with only message', () => {
      let errorText = 'Error1';
      
      errors.logWarn(errorText);
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.yellow('\nWarning: ' + errorText), '\n');
      
      // Future tests: This is important here!
      resetEnvironment();
    });
    
    it('logs warn with message and context', () => {
      let errorText = 'Error1';
      let contextText = 'Context1';
      
      errors.logWarn(errorText, contextText);
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.yellow('\nWarning: ' + errorText), '\n', chalk.white(contextText), '\n'
      );
      
      // Future tests: This is important here!
      resetEnvironment();
    });
    
    it('logs warn with message and context and help', () => {
      let errorText = 'Error1';
      let contextText = 'Context1';
      let helpText = 'Help1';
      
      errors.logWarn(errorText, contextText, helpText);
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.yellow('\nWarning: ' + errorText), '\n', chalk.white(contextText), '\n',   chalk.green(helpText), '\n'
      );
      
      // Future tests: This is important here!
      resetEnvironment();
    });
  });
  
  describe('Error Logging', () => {
    let logStub;
    
    beforeEach(() => {
      logStub = sinon.stub(console, 'error');
      // give environment a value that will console log
      process.env.NODE_ENV = 'development';
    });
    
    afterEach(() => {
      logStub.restore();
      // reset the environment
      process.env.NODE_ENV = currentEnv;
    });
    
    it('logs errors from error objects', () => {
      let err = new Error('test1');
      
      errors.logError(err);
      
      // Calls log with message on Error objects
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', err.message), '\n', '\n', err.stack, '\n').should.be.true;
    });
    
    it('logs errors from strings', () => {
      let err = 'test2';
      
      errors.logError(err);
      
      // Calls log with string on strings
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', err), '\n').should.be.true;
    });
    
    it('logs errors from an error object and two string arguments', () => {
      let err = new Error('test1');
      let message = 'Testing';
      
      errors.logError(err, message, message);
      
      // Calls log with message on Error objects
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.red('\nERROR:', err.message), '\n', chalk.white(message), '\n', chalk.green(message), '\n', err.stack, '\n'
      );
    });
    
    it('logs errors from three string arguments', () => {
      let message = 'Testing';
      
      errors.logError(message, message, message);
      
      // Calls log with message on Error objects
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.red('\nERROR:', message), '\n', chalk.white(message), '\n', chalk.green(message), '\n'
      ).should.be.true;
    });
    
    it('logs errors from an undefined error argument', () => {
      let message = 'Testing';
      
      errors.logError(undefined, message, message);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.red('\nERROR:', 'An unknown error occurred.'), '\n', chalk.white(message), '\n', chalk.green(message), '\n'
      ).should.be.true;
    });
    
    it('logs errors from an undefined context argument', () => {
      let message = 'Testing';
      
      errors.logError(message, undefined, message);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', message), '\n', chalk.green(message), '\n').should.be.true;
    });
    
    it('logs errors from an undefined help argument', () => {
      let message = 'Testing';
      
      errors.logError(message, message, undefined);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', message), '\n', chalk.white(message), '\n').should.be.true;
    });
    
    it('logs errors from an null error argument', () => {
      let message = 'Testing';
      
      errors.logError(null, message, message);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(
        chalk.red('\nERROR:', 'An unknown error occurred.'), '\n', chalk.white(message), '\n', chalk.green(message), '\n'
      ).should.be.true;
    });
    
    it('logs errors from an null context argument', () => {
      let message = 'Testing';
      
      errors.logError(message, null, message);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', message), '\n', chalk.green(message), '\n').should.be.true;
    });
    
    it('logs errors from an null help argument', () => {
      let message = 'Testing';
      
      errors.logError(message, message, null);
      
      // Calls log with message on Error objects
      
      logStub.calledOnce.should.be.true;
      logStub.calledWith(chalk.red('\nERROR:', message), '\n', chalk.white(message), '\n').should.be.true;
    });
    
    // it('logs promise errors and redirects', (done) => {
    //   let req = null;
    //   let res = {
    //     redirect: () => {
    //       return;
    //     }
    //   };
    //   let redirectStub = sinon.stub(res, 'redirect');
      
    //   // give environment a value that will console log
    //   Promise.reject().then(() => {
    //     throw new Error('Ran success handler');
    //   }, errors.logErrorWithRedirect('test1', null, null, '/testurl', req, res));
      
    //   Promise.reject().catch(() => {
    //     logStub.calledWith(chalk.red('\nERROR:', 'test1')).should.equal(true);
    //     logStub.restore();
        
    //     redirectStub.calledWith('/testurl').should.equal(true);
    //     redirectStub.restore();
        
    //     done();
    //   });
    // });
  });
})