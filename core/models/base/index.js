import _ from 'lodash';
import Promise from 'bluebird';
import bookshelf from 'bookshelf';
import knex from 'knex';
import errors from '../../errors';
import ConfigManager from '../../config';
import filters from '../../filters';
import moment from 'moment';
import validator from 'validator';
import utils from '../../utils';
import uuid from 'node-uuid';
import schema from '../data/schema';
import validation from '../data/validation';

const sanitizer = validator.sanitize;
let config = ConfigManager.config;

// Initializes a new Bookshelf instance called appBookshelf, for reference elsewhere.
let appBookshelf = bookshelf(config.database.knex);

// Load the Bookshelf registry plugin, which helps us avoid circular dependencies
appBookshelf.plugin('registry');

/**
 * App Bookshelf
 * The Base Model which other model obbjects will inherit from
 */
appBookshelf.Model = appBookshelf.Model.extend({
  // Bookshelf `hasTimestamps` - handles created_at and updated_at properties
  hasTimestamps: true,
  
  // option handling - get permitted attributes from data/schema.js, where the DB schema is defined
  permittedAttributes() {
    return _.keys(schema[this.tableName]);
  },
  
  // Bookshelf `defaults` - default values setup on every model creation
  defaults() {
    return {
      uuid: uuid.v4()
    };
  },
  
  // Bookshelf `initialize` - declare a constructor-like method for model creation
  initialize() {
    const self = this;
    let options = arguments[1] || {};
    
    // make options include available for toJSON()
    if (options.include) {
      this.include = _.clone(options.include);
    }
    
    this.on('creating', this.creating, this);
    this.on('saving', function onSaving(model, attributes, options) {
      return Promise.resolve(self.saving(model, attributes, options)).then(function then() {
        return self.validate(model, attributes, options);
      });
    });
  },
  
  validate() {
    return validation.validateSchema(this.tableName, this.toJSON());
  },
  
  creating(newObj, attr, options) {
    if (!this.get('created_by')) {
      this.set('created_by', this.contextUser(options));
    }
  },
  
  saving(newObj, attr, options) {
    // Remove any properties which don't belong on the model
    this.attributes = this.pick(this.permittedAttributes());
    // Store the previous attributes so we can tell what was updated later
    this._updatedAttributes = newObj.previousAttributes();
    
    this.set('updated_by', this.contextUser(options));
  },
  
  // Base prototype properties will go here
  // Fix problems with dates
  fixDates(attrs) {
    const self = this;
    
    _.each(attrs, function each(value, key) {
      if (value !== null && 
          schema[self.tableName].hasOwnProperty(key) && 
          schema[self.tableName][key].type === 'dateTime') {
        // convert dateTime value into a native javascript Date object
        attrs[key] = moment(value).toDate();
      }
    });
    
    return attrs;
  },
  
  // Convert integers to real booleans
  fixBools(attrs) {
    const self = this;
    _.each(attrs, function each(value, key) {
      if (schema[self.tableName].hasOwnProperty(key) && 
          schema[self.tableName][key].type === 'bool') {
        attrs[key] = value ? true : false;
      }
    });
    
    return attrs;
  },
  
  // Get the user from the options object
  contextUser(options) {
    // Default to context user
    if (options.context && options.context.user) {
      return options.context.user;
    // Other wise use the internal override
    } else if (options.context && options.context.internal) {
      return 1;
    } else {
      errors.logAndThrowError(new Error('missing context'));
    }
  },
  
  // format date before writing to DB, bools work
  format(attrs) {
    return this.fixDates(attrs);
  },
  
  // format data and bool when fetching from DB
  parse(attrs) {
    return this.fixBools(this.fixDates(attrs));
  },
  
  toJSON(options) {
    let attrs = _.extend({}, this.attributes);
    const self = this;
    options = options || {};
    options = _.pick(options, ['shallow', 'baseKey', 'include', 'context']);
    
    if (options && options.shallow) {
      return attrs;
    }
    
    if (options && options.include) {
      this.include = _.union(this.include, options.include);
    }
    
    _.each(this.relations, function each(relation, key) {
      if (key.substring(0, 7) !== '_pivot_') {
        // if include is set, expand to full object
        let fullKey = _.isEmpty(options.baseKey) ? key : options.baseKey + '.' + key;
        if (_.contains(self.include, fullKey)) {
          attrs[key] = relation.toJSON(_.extend({}, options, {baseKey: fullKey, include: self.include}));
        }
      }
    });
    
    return attrs;
  },
  
  sanitize(attr) {
    return sanitizer(this.ge(attr)).xss();
  },
  
  // Get attributes that have been updated (values before a .save() call)
  updatedAttributes() {
    return this._updatedAttributes || {};
  },
  
  // Get a specific updated attribute value
  updated(attr) {
    return this.updatedAttributes()[attr];
  }
}, {
  // Data Utility Functions
  permittedOptions() {
    // terms to whitelist for all methods.
    return ['context', 'include', 'transacting'];
  },
  
  filterData(data) {
    let permittedAttributes = this.prototype.permittedAttributes();
    let filteredData = _.pick(data, permittedAttributes);
    
    return filteredData;
  },
  
  filterOptions(options, methodName) {
    let permittedOptions = this.permittedOptions(methodName);
    let filteredOptions = _.pick(options, permittedOptions);
    
    return filteredOptions;
  },
  
  // ## Model Data Functions
  
  /**
   * Find All
   * Naive find all fetches all the data for a particular model
   */
  findAll(options) {
    options = this.filterOptions(options, 'findAll');
    return this.forge().fetchAll(options).then(function then(result) {
      if (options.include) {
        _.each(result.models, function each(item) {
          item.include = options.include;
        });
      }
      return result;
    });
  },
  
  findOne(data, options) {
    data = this.filterData(data);
    options = this.filterOptions(options, 'findOne');
    // We pass include to forge so that toJSON has access
    return this.forge(data, {include: options.include}).fetch(options);
  },
  
  edit(data, options) {
    let id = options.id;
    data = this.filterData(data);
    options = this.filterOptions(options, 'edit');
    
    return this.forge({id: id}).fetch(options).then(function then(object) {
      if (object) {
        return object.save(data, options);
      }
    });
  },
  
  add(data, options) {
    data = this.filterData(data);
    options = this.filterOptions(options, 'add');
    let model = this.forge(data);
    return model.save(null, options);
  },
  
  destroy(options) {
    let id = options.id;
    options = this.filterOptions(options, 'destroy');
    
    // Fetch the object before destroying it, so that the change data is available to events
    return this.forge({id: id}).fetch(options).then(function then(object) {
      return object.destroy(options);
    });
  }
});

export default appBookshelf;