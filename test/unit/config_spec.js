/*globals describe, it, before, beforeEach, afterEach, after */
import should from 'should';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import knex from 'knex';
import rewire from 'rewire';

// Stuff to test
import ConfigManager from '../../core/config';
const config = ConfigManager.config;

describe('Config', () => {
  describe('Index', () => {
    it('should have the right path keys', () => {
      let configPaths = config.paths;
      
      // This will fail if there are any less/extra keys
      configPaths.should.have.keys(
        'appRoot',
        'corePath',
        'subdir',
        'configPath',
        'templatesPath',
        'stylesPath',
        'publicPath'
      );
    });
    
    it('should have the correct values for each paths key', () => {
      let configPaths = config.paths;
      let appRoot = path.resolve(__dirname, '../../');
      
      configPaths.should.have.property('appRoot', appRoot);
      configPaths.should.have.property('subdir', '');
    });
  });
  
  describe('Database', () => {
    it('should have a knex instance', () => {
      let configKnex = config.database.knex;
      configKnex.should.have.property('__knex__', '0.8.6');
    });
    
    it('should have the correct values for each database key', () => {
      let configDB = config.database;
      
      configDB.should.have.property('client', 'sqlite3');
    });
  })
});