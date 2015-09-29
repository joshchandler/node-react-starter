import schema from './schema';
import Promise from 'bluebird';
import _ from 'lodash';
import validator from 'validator';
import ConfigManager from '../../config';
import errors from '../../errors';

let config = ConfigManager.config;

// A few custom validators
validator.extend('empty', function empty(str) {
  return _.isEmpty(str);
});

validator.extend('notContains', function notContains(str, badString) {
  return !_.contains(str, badString);
});

validator.extend('isEmptyOrURL', function isEmptyOrURL(str) {
  return (_.isEmpty(str) || validator.isURL(str, {require_protocol: false}));
});

// Validation against schema attributes
// values are checked against the validation objects from schema.js
function validateSchema(tableName, model) {
  let columns = _.keys(schema[tableName]);
  let validationErrors = [];
  
  _.each(columns, function each(columnKey) {
    let message = '';
    
    // check nullable
    if (model.hasOwnProperty(columnKey) && schema[tableName][columnKey].hasOwnProperty('nullable') &&
        schema[tableName][columnKey].nullable !== true) {
      if (validator.isNull(model[columnKey]) || validator.empty(model[columnKey])) {
        message = 'Value in [' + tableName + '.' + columnKey + '] cannot be blank.';
        validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
      }
    }
    
    // @todo: check if mandatory values should be enforced
    if (model[columnKey] !== null && model[columnKey] !== undefined) {
      // check length
      if (schema[tableName][columnKey].hasOwnProperty('maxlength')) {
        if (!validator.isLength(model[columnKey], 0, schema[tableName][columnKey].maxlength)) {
          message = 'Value in [' + tableName + '.' + columnKey + '] exceeds maximum length of ' +
            schema[tableName][columnKey].maxlength + ' characters.';
          validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
        }
      }
      
      // check validation objects
      if (schema[tableName][columnKey].hasOwnProperty('validations')) {
        validationErrors = validationErrors.concat(validate(model[columnKey], columnKey, schema[tableName][columnKey].validations));
      }
      
      // check type
      if (schema[tableName][columnKey].hasOwnProperty('type')) {
        if (schema[tableName][columnKey].type === 'integer' && !validator.isInt(model[columnKey])) {
          message = 'Value in [' + tableName + '.' + columnKey + '] is not an integer.';
          validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
        }
      }
    }
  });
  
  if (validationErrors.length !== 0) {
    return Promise.reject(validationErrors);
  }
  
  return Promise.resolve();
}

function validateSettings(defaultSettings, model) {
  let values = model.toJSON();
  let validationErrors = [];
  let matchingDefault = defaultSettings[values.key];
  
  if (matchingDefault && matchingDefault.validations) {
    validationErrors = validationErrors.concat(validate(values.value, values.key, matchingDefault.validations));
  }
  
  if (validationErrors.length !== 0) {
    return Promise.reject(validationErrors);
  }
  
  return Promise.resolve();
}

function validate(value, key, validations) {
  let validationErrors = [];
  
  _.each(validations, function each(validationOptions, validationName) {
    let goodResult = true;
    
    if (_.isBoolean(validationOptions)) {
      goodResult = validationOptions;
      validationOptions = [];
    } else if (!_.isArray(validationOptions)) {
      validationOptions = [validationOptions];
    }
    
    validationOptions.unshift(value);
    
    // equivalent of validator.isSomething(option1, option2)
    if (validator[validationName].apply(validator, validationOptions) !== goodResult) {
      validationErrors.push(new errors.ValidationError('Validation (' + validationName + ') failed for ' + key, key));
    }
    
    validationOptions.shift();
  }, this);
  
  return validationErrors;
}

export default {
  validate: validate,
  validateSettings: validateSettings,
  validateSchema: validateSchema
};