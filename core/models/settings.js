import appBookshelf from './base';
import uuid from 'node-uuid';
import _ from 'lodash';
import errors from '../errors';
import Promise from 'bluebird';
import validation from './data/validation';
import events from '../events';

let internal = {context: {internal: true}};
let defaultSettings; 

function parseDefaultSettings() {
  let defaultSettingsInCategories = require('./data/default-settings');
  let defaultSettingsFlattened = {};
  
  _.each(defaultSettingsInCategories, function each(settings, categoryName) {
    _.each(settings, function each(setting, settingName) {
      setting.type = categoryName;
      setting.key = settingName;
      
      defaultSettingsFlattened[settingName] = setting;
    });
  });
  
  return defaultSettingsFlattened;
}

function getDefaultSettings() {
  if (!defaultSettings) {
    defaultSettings = parseDefaultSettings();
  }
  return defaultSettings;
}

// Each setting is saved as a separate row in the database,
// but the overlying API treats them as a single key:value mapping
let Settings = appBookshelf.Model.extend({
  
  tableName: 'settings',
  
  defaults() {
    return {
      uuid: uuid.v4(),
      type: 'core'
    };
  },
  
  emitChange(event) {
    events.emit('settings' + '.' + event, this);
  },
  
  initialize() {
    appBookshelf.Model.prototype.initialize.apply(this, arguments);
    
    this.on('created', (model) => {
      model.emitChange('added');
      model.emitChange(model.attributes.key + '.' + 'added');
    });
    this.on('updated', (model) => {
      model.emitChange('edited');
      model.emitChange(model.attributes.key + '.' + 'edited');
    });
    this.on('destroyed', (model) => {
      model.emitChange('deleted');
      model.emitChange(model.attributes.key + '.' + 'deleted');
    });
  },
  
  validate() {
    const self = this;
    var setting = this.toJSON();
    
    return validation.validateSchema(self.tableName, setting).then(function then() {
      return validation.validateSettings(getDefaultSettings(), self);
    });
  },
  
  saving() {
    return appBookshelf.Model.prototype.saving.apply(this, arguments);
  }
}, {
  findOne(options) {
    // Allow for just passing the key instead of attributes
    if (!_.isObject(options)) {
      options = {key: options};
    }
    return Promise.resolve(appBookshelf.Model.findOne.call(this, options));
  },
  
  edit(data, options) {
    const self = this;
    options = this.filterOptions(options, 'edit');
    
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    return Promise.map(data, (item) => {
      // Accept an array of models as input
      if (item.toJSON) { item = item.toJSON(); }
      if (!(_.isString(item.key) && item.key.length > 0)) {
        return Promise.reject(new errors.ValidationError('Value in [settings.key] cannot be blank.'));
      }
      
      item = self.filterData(item);
      
      return Settings.forge({key: item.key}).fetch(options).then(function then(setting) {
        let saveData = {};
        
        if (setting) {
          if (item.hasOwnProperty('value')) {
            saveData.value = item.value;
          }
          // Internal context can overwrite type (for fixture migrations)
          if (options.context.internal && item.hasOwnProperty('type')) {
            saveData.type = item.type;
          }
          return setting.save(saveData, options);
        }
        
        return Promise.reject(new errors.NotFoundError('Unable to find setting to update: ' + item.key));
      }, errors.logAndThrowError);
    });
  },
  
  populateDefault: (key) => {
    if (!getDefaultSettings()[key]) {
      return Promise.reject(new errors.logError('Unable to find default setting: ' + key));
    }
    
    return this.findOne({key: key}).then(function then(foundSetting) {
      if (foundSetting) {
        return foundSetting;
      }
      
      let defaultSetting = _.clone(getDefaultSettings()[key]);
      defaultSetting.value = defaultSetting.defaultValue;
      
      return Settings.forge(defaultSetting).save(null, internal);
    });
  },
  
  populateDefaults() {
    return this.findAll().then(function then(allSettings) {
      let usedKeys = allSettings.models.map(function mapper(setting) { return setting.get('key'); });
      let insertOperations = [];
      
      _.each(getDefaultSettings(), function each(defaultSetting, defaultSettingKey) {
        let isMissingFromDB = usedKeys.indexOf(defaultSettingKey) === -1;
        if (isMissingFromDB) {
          defaultSetting.value = defaultSetting.defaultValue;
          insertOperations.push(Settings.forge(defaultSetting).save(null, internal));
        }
      });
      
      return Promise.all(insertOperations);
    });
  }
});

export default {
  Settings: appBookshelf.model('Settings', Settings)
};