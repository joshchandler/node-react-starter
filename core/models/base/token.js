import Promise from 'bluebird';
import appBookshelf from './index';
import errors from '../../errors';


export default appBookshelf.Model.extend({
  user() {
    return this.belongsTo('User');
  },
  
  client() {
    return this.belongsTo('Client');
  },
  
  // override for base function since we don't have
  // a created_by field for sessions
  creating(newObj, attr, options) {
    
  },
  
  // override for base function since we don't have
  // an updated_by field for sessions
  saving(newObj, attr, options) {
    // Remove any properties which don't belong on the model
    this.attributes = this.pick(this.permittedAttributes());
  }
}, {
  destroyAllExpired(options) {
    options = this.filterOptions(options, 'destroyAll');
    return appBookshelf.Collection.forge([], {model: this})
      .query('where', 'expires', '<', Date.now())
      .fetch(options)
      .then(function then(collection) {
        collection.invokeThen('destroy', options);
      });
  },
  
  /**
   * Destroy By User
   * @param {[type]} options has context and id.  Context is the user doing the destroy, id is the user to destroy
   */
  destroyByUser(options) {
    let userId = options.id;
    
    options = this.filterOptions(options, 'destroyByUser');
    
    if (userId) {
      return appBookshelf.Collection.forge([], {model: this})
        .query('where', 'user_id', '=', userId)
        .fetch(options)
        .then(function then(collection) {
          collection.invokeThen('destroy', options);
        });
    }
    
    // @todo: Not Found Error
    return Promise.reject();
  },
  
  /**
   * Destroy By Token
   * @param {[type]} options has token where token is the token to destroy
   */
  destroyByToken(options) {
    let token = options.token;
    
    options = this.filterOptions(options, 'destroyByUser');
    
    if (token) {
      return appBookshelf.Collection.forge([], {model: this})
        .query('where', 'token', '=', token)
        .fetch(options)
        .then(function then(collection) {
          collection.invokeThen('destroy', options);
        });
    }
    
    // @todo: Not Found Error
    return Promise.reject();
  }
});