import _ from 'lodash';
import Promise from 'bluebird';
import errors from '../errors';
import utils from '../utils';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import validator from 'validator';
import request from 'request';
import validation from './data/validation';
import appBookshelf from './base';
import ConfigManager from '../config';
import events from '../events';

let config = ConfigManager.config;

let bcryptGenSalt = Promise.promisify(bcrypt.genSalt);
let bcryptHash = Promise.promisify(bcrypt.hash);
let bcryptCompare = Promise.promisify(bcrypt.compare);

let tokenSecurity = {};
let activeStates = ['active', 'warn-1', 'warn-2', 'warn-3', 'warn-4', 'locked'];
let invitedStates = ['invited', 'invited-pending'];

function validatePasswordLength(password) {
  return validator.isLength(password, 8);
}

function generatePasswordHash(password) {
  // Generate a new salt
  return bcryptGenSalt().then((salt) => {
    // Hash the provided password with bcrypt
    return bcryptHash(password, salt);
  });
}

let User = appBookshelf.Model.extend({
  
  tableName: 'users',
  
  emitChange(event) {
    events.emit('user' + '.' + event, this);
  },
  
  initialize() {
    appBookshelf.Model.prototype.initialize.apply(this, arguments);
    
    this.on('created', function onCreated(model) {
      model.emitChange('added');
      
      // active is the default state, so if status isn't provided, this will be an active user
      if (!model.get('status') || _.contains(activeStates, model.get('status'))) {
        model.emitChange('activated');
      }
    });
    this.on('updated', function onUpdated(model) {
      model.statusChanging = model.get('status') !== model.updated('status');
      model.isActive = _.contains(activeStates, model.get('status'));
      
      if (model.statusChanging) {
        model.emitChange(model.isActive ? 'activated' : 'deactivated');
      } else {
        if (model.isActive) {
          model.emitChange('activated.edited');
        }
      }
        
      model.emitChange('edited');
    });
    this.on('destroyed', function onDestroyed(model) {
      if (_.contains(activeStates, model.previous('status'))) {
        model.emitChange('deactivated');
      }
      
      model.emitChange('deleted');
    });
  },
  
  saving(newPage, attr, options) {
    const self = this;
    
    appBookshelf.Model.prototype.saving.apply(this, arguments);
  },
  
  validate() {
    let opts = arguments[1];
    if (opts && _.has(opts, 'validate') && opts.validate === false) {
      return;
    }
    return validation.validateSchema(this.tableName, this.toJSON());
  },
  
  contextUser(options) {
    // Default to context user
    if (options.context && options.context.user) {
      return options.context.user;
    } else if (options.context && options.context.internal) {
      return 1;
    } else if (this.get('id')) {
      return this.get('id');
    } else {
      errors.logAndThrowError(new errors.NotFoundError('missing context'));
    }
  },
  
  toJSON(options) {
    options = options || {};
    
    let attrs = appBookshelf.Model.prototype.toJSON.call(this, options);
    // remote password hash for security reasons
    delete attrs.password;
    
    if (!options || !options.context || (!options.context.user && !options.context.internal)) {
      delete attrs.email;
    }
    
    return attrs;
  },
  
  roles() {
    return this.belongsToMany('Role');
  },
  
  hasRole(roleName) {
    let roles = this.related('roles');
    
    return roles.some(function getRole(role) {
      return role.get('name') === roleName;
    });
  }
}, {
  setupFilters(options) {
    let filterObjects = {};
    if (options.role !== undefined) {
      filterObjects.roles = appBookshelf.model('Role').forge({name: options.role});
    }
    
    return filterObjects;
  },
  
  findPageDefaultOptions() {
    return {
      status: 'active',
      where: {},
      whereIn: {}
    };
  },
  
  orderDefaultOptions() {
    return {
      created_at: 'DESC'
    };
  },
  
  processOptions(itemCollection, options) {
    // @todo: there are mutliple statuses that make a user "active" or "invited" - we want to translate/map them:
    // @todo: * valid "active" status: active, warn-1, warn-2, warn-3, warn-4, locked
    // @todo: * valid "invited" statuses: invited, invited-pending
    
    // Filter on the status. A status of 'all' translates to no filter since we want all statuses
    if (options.status && options.status !== 'all') {
      // make sure that status is valid
      // @todo: need a better way of getting a list of statuses other than hard-coding them...
      options.status = _.indexOf(
        ['active', 'warn-1', 'warn-2', 'warn-3', 'warn-4', 'locked', 'invited', 'inactive'],
        options.status
      ) !== -1 ? options.status : 'active';
    }
    
    if (options.status === 'active') {
      itemCollection.query().whereIn('status', activeStates);
    } else if (options.status === 'invited') {
      itemCollection.query().whereIn('status', invitedStates);
    } else if (options.status !== 'all') {
      options.where.status = options.status;
    }
    
    return options;
  },
  
  findAll(options) {
    options = options || {};
    options.withRelated = _.union(options.withRelated, options.include);
    return appBookshelf.Model.findAll.call(this, options);
  },
  
  findOne(data, options) {
    let query;
    let status;
    let lookupRole = data.role;
    
    delete data.role;
    
    data = _.defaults(data || {}, {
      status: 'active'
    });
    
    status = data.status;
    delete data.status;
    
    options = options || {};
    options.withRelated = _.union(options.withRelated, options.include);
    data = this.filterData(data);
    
    // Support finding a role
    if (lookupRole) {
      options.withRelated = _.union(options.withRelated, ['roles']);
      options.include = _.union(options.include, ['roles']);
      
      query = this.forge(data, {include: options.include});
      
      query.query('join', 'roles_users', 'users.id', '=', 'roles_users.id');
      query.query('join', 'roles', 'roles_users.role_id', '=', 'roles.id');
      query.query('where', 'roles.name', '=', lookupRole);
    } else {
      // We pass include to forge so that toJSON has access
      query = this.forge(data, {include: options.include});
    }
    
    if (status === 'active') {
      query.query('whereIn', 'status', activeStates);
    } else if (status === 'invited') {
      query.query('whereIn', 'status', invitedStates);
    } else if (status !== 'all') {
      query.query('where', {status: options.status});
    }
    
    options = this.filterOptions(options, 'findOne');
    delete options.include;
    
    return query.fetch(options);
  },
  
  edit(data, options) {
    const self = this;
    let roleId;

    if (data.roles && data.roles.length > 1) {
      return Promise.reject(
        new errors.ValidationError('Only one role per user is supported at the moment.')
      );
    }

    options = options || {};
    options.withRelated = _.union(options.withRelated, options.include);

    return appBookshelf.Model.edit.call(this, data, options).then(function then(user) {
      if (!data.roles) {
        return user;
      }

      roleId = parseInt(data.roles[0].id || data.roles[0], 10);

      return user.roles().fetch().then(function then(roles) {
        // return if the role is already assigned
        if (roles.models[0].id === roleId) {
          return;
        }
        return appBookshelf.model('Role').findOne({id: roleId});
      }).then(function then(roleToAssign) {
        if (roleToAssign && roleToAssign.get('name') === 'Owner') {
          return Promise.reject(
            new errors.ValidationError('This method does not support assigning the owner role')
          );
        } else {
          // assign all other roles
          return user.roles().updatePivot({role_id: roleId});
        }
      }).then(function then() {
        options.status = 'all';
        return self.findOne({id: user.id}, options);
      });
    });
  },
  
  add(data, options) {
    const self = this;
    let userData = this.filterData(data);
    let roles;

    options = this.filterOptions(options, 'add');
    options.withRelated = _.union(options.withRelated, options.include);
        
    // check for too many roles
    if (data.roles && data.roles.length > 1) {
      return Promise.reject(new errors.ValidationError('Only one role per user is supported at the moment.'));
    }

    if (!validatePasswordLength(userData.password)) {
      return Promise.reject(new errors.ValidationError('Your password must be at least 8 characters long.'));
    }

    roles = data.roles;
    delete data.roles;

    return generatePasswordHash(userData.password).then(function then(hash) {
      // Assign the hashed password
      userData.password = hash;
      
      return userData;
    }).then(function then(userData) {
      // Save the user with the hashed password
      return appBookshelf.Model.add.call(self, userData, options);
    }).then(function then(addedUser) {
      // Assign the userData to our created user so we can pass it back
      userData = addedUser;
      // if we are given a "role" object, only pass in the role ID in place of the full object
      return Promise.resolve(roles).then(function then(roles) {
        roles = _.map(roles, function mapper(role) {
          if (_.isString(role)) {
            return parseInt(role, 10);
          } else if (_.isNumber(role)) {
            return role;
          } else {
            return parseInt(role.id, 10);
          }
        });
        return addedUser.roles().attach(roles, options);
      });
    }).then(function then() {
      // find and return the added user
      return self.findOne({id: userData.id, status: 'all'}, options);
    });
  },
  
  setWarning(user, options) {
    let status = user.get('status');
    let regexp = /warn-(\d+)/i;
    let level;

    if (status === 'active') {
      user.set('status', 'warn-1');
      level = 1;
    } else {
      level = parseInt(status.match(regexp)[1], 10) + 1;
      if (level > 4) {
        user.set('status', 'locked');
      } else {
        user.set('status', 'warn-' + level);
      }
    }
    return Promise.resolve(user.save(options)).then(function then() {
      return 5 - level;
    });
  },
  
  // Finds the user by email, and checks the password
  check(object) {
    const self = this;
    let s;
    
    return this.getByEmail(object.email).then(function then(user) {
      if (!user) {
        return Promise.reject(new errors.NotFoundError('There is no user with that email address.'));
      }
      if (user.get('status') === 'invited' || user.get('status') === 'invited-pending' ||
          user.get('status') === 'inactive'
         ) {
        return Promise.reject(new errors.NoPermissionError('The user with that email address is inactive.'));
      }
      if (user.get('status') !== 'locked') {
        return bcryptCompare(object.password, user.get('password')).then(function then(matched) {
          if (!matched) {
            return Promise.resolve(self.setWarning(user, {validate: false})).then(function then(remaining) {
              s = (remaining > 1) ? 's' : '';
              return Promise.reject(new errors.UnauthorizedError('Your password is incorrect. <br />' +
                                                                 remaining + ' attempt' + s + ' remaining!'));

              // Use comma structure, not .catch, because we don't want to catch incorrect passwords
            }, function handleError(error) {
              // If we get a validation or other error during this save, catch it and log it, but don't
              // cause a login error because of it. The user validation is not important here.
              errors.logError(
                error,
                'Error thrown from user update during login',
                'Visit and save your profile after logging in to check for problems.'
              );
              return Promise.reject(new errors.UnauthorizedError('Your password is incorrect.'));
            });
          }

          return Promise.resolve(user.set({status: 'active', last_login: new Date()}).save({validate: false}))
            .catch(function handleError(error) {
            // If we get a validation or other error during this save, catch it and log it, but don't
            // cause a login error because of it. The user validation is not important here.
              errors.logError(
                error,
                'Error thrown from user update during login',
                'Visit and save your profile after logging in to check for problems.'
              );
              return user;
            });
        }, errors.logAndThrowError);
      }
      return Promise.reject(new errors.NoPermissionError('Your account is locked. Please reset your password ' +
                                                         'to log in again by clicking the "Forgotten password?" link!'));
    }, function handleError(error) {
      if (error.message === 'NotFound' || error.message === 'EmptyResponse') {
        return Promise.reject(new errors.NotFoundError('There is no user with that email address.'));
      }

      return Promise.reject(error);
    });
  },
  
  changePassword(object, options) {
    const self = this;
    let newPassword = object.newPassword;
    let ne2Password = object.ne2Password;
    let userId = object.user_id;
    let oldPassword = object.oldPassword;
    let user;

    if (newPassword !== ne2Password) {
      return Promise.reject(new errors.ValidationError('Your new passwords do not match'));
    }

    if (userId === options.context.user && _.isEmpty(oldPassword)) {
      return Promise.reject(new errors.ValidationError('Password is required for this operation'));
    }

    if (!validatePasswordLength(newPassword)) {
      return Promise.reject(new errors.ValidationError('Your password must be at least 8 characters long.'));
    }

    return self.forge({id: userId}).fetch({require: true}).then(function then(_user) {
      user = _user;
      if (userId === options.context.user) {
        return bcryptCompare(oldPassword, user.get('password'));
      }
      // if user is admin, password isn't compared
      return true;
    }).then(function then(matched) {
      if (!matched) {
        return Promise.reject(new errors.ValidationError('Your password is incorrect'));
      }

      return generatePasswordHash(newPassword);
    }).then(function then(hash) {
      return user.save({password: hash});
    });
  },
  
  generateResetToken(email, expires, dbHash) {
    return this.getByEmail(email).then(function then(foundUser) {
      if (!foundUser) {
        return Promise.reject(new errors.NotFoundError('There is no user with that email address.'));
      }

      var hash = crypto.createHash('sha256');
      var text = '';

      // Token:
      // BASE64(TIMESTAMP + email + HASH(TIMESTAMP + email + oldPasswordHash + dbHash ))
      hash.update(String(expires));
      hash.update(email.toLocaleLowerCase());
      hash.update(foundUser.get('password'));
      hash.update(String(dbHash));

      text += [expires, email, hash.digest('base64')].join('|');
      return new Buffer(text).toString('base64');
    });
  },
  
  validateToken(token, dbHash) {
    // @todo: Is there a chance the use of ascii here will cause problems if oldPassword has weird characters?
    var tokenText = new Buffer(token, 'base64').toString('ascii');
    var parts;
    var expires;
    var email;

    parts = tokenText.split('|');

    // Check if invalid structure
    if (!parts || parts.length !== 3) {
      return Promise.reject(new errors.BadRequestError('Invalid token structure'));
    }

    expires = parseInt(parts[0], 10);
    email = parts[1];

    if (isNaN(expires)) {
      return Promise.reject(new errors.BadRequestError('Invalid token expiration'));
    }

    // Check if token is expired to prevent replay attacks
    if (expires < Date.now()) {
      return Promise.reject(new errors.ValidationError('Expired token'));
    }

    // to prevent brute force attempts to reset the password the combination of email+expires is only allowed for
    // 10 attempts
    if (tokenSecurity[email + '+' + expires] && tokenSecurity[email + '+' + expires].count >= 10) {
      return Promise.reject(new errors.NoPermissionError('Token locked'));
    }

    return this.generateResetToken(email, expires, dbHash).then(function then(generatedToken) {
      // Check for matching tokens with timing independent comparison
      var diff = 0;
      var i;

      // check if the token length is correct
      if (token.length !== generatedToken.length) {
        diff = 1;
      }

      for (i = token.length - 1; i >= 0; i = i - 1) {
        diff |= token.charCodeAt(i) ^ generatedToken.charCodeAt(i);
      }

      if (diff === 0) {
        return email;
      }

      // increase the count for email+expires for each failed attempt
      tokenSecurity[email + '+' + expires] = {
        count: tokenSecurity[email + '+' + expires] ? tokenSecurity[email + '+' + expires].count + 1 : 1
      };
      return Promise.reject(new errors.BadRequestError('Invalid token'));
    });
  },
  
  resetPassword(options) {
    var self = this;
    var token = options.token;
    var newPassword = options.newPassword;
    var ne2Password = options.ne2Password;
    var dbHash = options.dbHash;

    if (newPassword !== ne2Password) {
      return Promise.reject(new errors.ValidationError('Your new passwords do not match'));
    }

    if (!validatePasswordLength(newPassword)) {
      return Promise.reject(new errors.ValidationError('Your password must be at least 8 characters long.'));
    }

    // Validate the token; returns the email address from token
    return self.validateToken(utils.decodeBase64URLsafe(token), dbHash).then(function then(email) {
      // Fetch the user by email, and hash the password at the same time.
      return Promise.join(
        self.getByEmail(email),
        generatePasswordHash(newPassword)
      );
    }).then(function then(results) {
      if (!results[0]) {
        return Promise.reject(new errors.NotFoundError('User not found'));
      }

      // Update the user with the new password hash
      var foundUser = results[0];
      var passwordHash = results[1];

      return foundUser.save({password: passwordHash, status: 'active'});
    });
  },
  
  // Get the user by email address, enforces case insensitivity rejects if the user is not found
  // When multi-user support is added, email addresses must be deduplicated with case insensitivity, so that
  // joe@bloggs.com and JOE@BLOGGS.COM cannot be created as two separate users.
  getByEmail(email, options) {
    options = options || {};
    // We fetch all users and process them in JS as there is no easy way to make this query across all DBs
    // Although they all support `lower()`, sqlite can't case transform unicode characters
    // This is somewhat mute, as validator.isEmail() also doesn't support unicode, but this is much easier / more
    // likely to be fixed in the near future.
    options.require = true;

    return Users.forge(options).fetch(options).then(function then(users) {
      var userWithEmail = users.find(function findUser(user) {
        return user.get('email').toLowerCase() === email.toLowerCase();
      });
      if (userWithEmail) {
        return userWithEmail;
      }
    });
  }
});

let Users = appBookshelf.Collection.extend({
  model: User
});

export default {
  User: appBookshelf.model('User', User),
  Users: appBookshelf.collection('Users', Users)
};
