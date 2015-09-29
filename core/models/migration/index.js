import _ from 'lodash';
import Promise from 'bluebird';
import sequence from '../../utils/sequence';
import path from 'path';
import fs from 'fs';
import errors from '../../errors';
import models from '../index';
import utils from '../utils';
import versioning from '../data/versioning';
import ConfigManager from '../../config';
import schema from '../data/schema';

let config = ConfigManager.config;
let defaultVersion = config.dbVersion;
let schemaTables = _.keys(schema);

function logInfo(message) {
  errors.logInfo('Migrations', message);
}

function populateDefaultSettings() {
  // Initialize the default settings
  logInfo('Populating default settings');
  return models.Settings.populateDefaults().then(() => {
    logInfo('Complete');
  });
}

// @todo: backupDatabase function here

let init = (tablesOnly) => {
  tablesOnly = tablesOnly || false;
  
  const self = this;
  
  // There are 4 possibilities:
  // 1. The database exists and is up-to-date
  // 2. The database exists but is out of date
  // 3. The database exists but the currentVersion setting does not or cannot be understood
  // 4. The database has not yet been created
  return versioning.getDatabaseVersion().then((databaseVersion) => {
    // if (databaseVersion < defaultVersion) {
    //   // 2. The database exists but is out of date
    //   // Migrate to latest version
    //   logInfo('database upgrade required from version ' + databaseVersion + ' to ' + defaultVersion);
    //   return self.migrateUp(databaseVersion, defaultVersion).then(() => {
    //     // Finally update the databases current version
    //     return versioning.setDatabaseVersion();
    //   });
    // }
    
    if (databaseVersion === defaultVersion) {
      // 1. The database exists and is up-to-date
      logInfo('Up to date at version ' + databaseVersion);
      return;
    }
    
    if (databaseVersion > defaultVersion) {
      // 3. The database exists but the currentVersion setting does not or cannot be understood
      // In this case we don't understand the version because it is too high
      errors.logErrorAndExit(
        'Your database is not compatible with this version',
        'You will need to create a new database'
      );
    }
  }, (err) => {
    if (err.message || err === 'Settings table does not exist') {
      // 4. The database has not yet been created
      // Bring everything up from initial version.
      logInfo('Database initialization required for version ' + defaultVersion);
      return migrateUpFreshDb(tablesOnly);
    }
    // 3. The database exists but the currentVersion setting does not or cannot be understood
    // In this case the setting was missing or there was some other problem
    errors.logErrorAndExit('There is a problem with the database', err.message || err);
  });
};

let reset = () => {
  let tables = _.map(schemaTables, (table) => {
    return () => {
      return utils.deleteTable(table);
    };
  }).reverse();
  
  return sequence(tables);
};

// Only do this if we have no database at all
let migrateUpFreshDb = (tablesOnly) => {
  let tableSequence;
  let tables = _.map(schemaTables, (table) => {
    return () => {
      logInfo('Creating table: ' + table);
      return utils.createTable(table);
    };
  });
  
  logInfo('Creating tables...');
  tableSequence = sequence(tables);
  
  if (tablesOnly) {
    return tableSequence;
  }
  return tableSequence.then(() => {
    return populateDefaultSettings();
  });
};

export default {
  init: init,
  reset: reset,
  migrateUpFreshDb: migrateUpFreshDb
};