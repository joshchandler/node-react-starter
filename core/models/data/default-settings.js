import ConfigManager from '../../config';

let config = ConfigManager.config;

export default {
  'core': {
    'databaseVersion': {
      'defaultValue': config.dbVersion
    }
  }
};