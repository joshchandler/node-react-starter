/*globals describe, it*/
import should from 'should';
import _ from 'lodash';
import crypto from 'crypto';

// Stuff to test
import defaultSettings from '../../core/models/data/default-settings';
import schema from '../../core/models/data/schema';
import ConfigManager from '../../core/config';

let config = ConfigManager.config;

describe('Migrations', () => {
  describe('DB version integrity', () => {
    // Only this variable should need updating
    
  });
});