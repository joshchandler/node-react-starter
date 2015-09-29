import Promise from 'bluebird';
import sequence from '../../core/utils/sequence';
import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import uuid from 'node-uuid';
import Models from '../../core/models';
import migration from '../../core/models/migration';
import Data from './fixtures/data';
import config from './config';

import { Settings } from '../../core/models/settings';

/** TEST FIXTURES **/
let fixtures = {
  insertRoles() {
    let knex = config.database.knex;
    return knex('roles').insert(Data.forKnex.roles);
  },
  insertAdminUser() {
    let user;
    let knex = config.database.knex;
    
    user = Data.forKnex.createUser(Data.Content.users[0]);
    
    return knex('users').insert(user).then(() => {
      return knex('roles_users').insert(Data.forKnex.roles_users[0]);
    });
  },
  createUsersWithRoles() {
    let knex = config.database.knex;
    return knex('roles').insert(Data.forKnex.roles).then(() => {
      return knex('users').insert(Data.forKnex.users);
    }).then(() => {
      return knex('roles_users').insert(Data.forKnex.roles_users);
    });
  },
  createUserWithoutRole() {
    let user;
    let knex = config.database.knex;
    
    user = Data.forKnex.createUser(Data.Content.users[4]);
    
    return knex('users').insert(user);
  },
  
  // Creates a client, and access and refresh tokens for user 1
  createTokensForUser() {
    let knex = config.database.knex;
    return knex('clients').insert(Data.forKnex.clients).then(() => {
      return knex('accesstokens').insert(Data.forKnex.createToken({user_id: 1}));
    }).then(() => {
      return knex('refreshtokens').insert(Data.forKnex.createToken({user_id: 1}));
    });
  },
  
  createInvitedUsers() {
    let knex = config.database.knex;
    // grab 3 more users
    extraUsers = Data.Content.users.slice(2, 5);
    
    extraUsers = _.map(extraUsers, (user) => {
      return Data.forKnex.createUser(_.extend({}, user, {
        email: 'inv' + user.email,
        username: 'inv' + user.username,
        status: 'invited-pending'
      }));
    });
    
    return knex('users').insert(extraUsers);
  },
  insertClients() {
    let knex = config.database.knex;
    return knex('clients').insert(Data.forKnex.clients);
  },
  insertAccessToken(override) {
    let knex = config.database.knex;
    return knex('accesstokens').insert(Data.forKnex.createToken(override));
  },
  insertOne(obj, fn) {
    let knex = config.database.knex;
    return knex(obj).insert(Data.forKnex[fn](Data.Content[obj][0]));
  }
};

/** Test Utility Functions **/
let initData = function initData() {
  return migration.init();
};

let clearData = function clearData() {
  // we must always try to delete all tables
  return migration.reset();
};

let toDoList = {
  role: function insertRole() { return fixtures.insertOne('roles', 'createRole'); },
  roles: function insertRoles() { return fixtures.insertRoles(); },
  user: function createUserWithoutRole() { return fixtures.createUserWithoutRole(); },
  users_roles: function createUsersWithRoles() { return fixtures.createUsersWithRoles(); },
  admin: function insertAdminUser() { return fixtures.insertAdminUser(); },
  settings: function populateSettings() {
    return Settings.populateDefaults();
  },
  clients: function insertClients() { return fixtures.insertClients(); }
};

/**
 * getFixturesOps
 * 
 * Takes the arguments from a setup function and turns them into an array of promises to fulfill
 * 
 * This is effectively a list of instructions with regard to whcih fixtures should be setup for this test.
 * @param {Object} toDos
 */
let getFixtureOps = function getFixtureOps(toDos) {
  // default = default fixtures, if it isn't present, init with tables only
  let tablesOnly = !toDos.default;
  let fixtureOps = [];
  
  // Database initialization
  if (toDos.init || toDos.default) {
    fixtureOps.push(function initDB() {
      return migration.init(tablesOnly);
    });
    delete toDos.default;
    delete toDos.init;
  }
  
  // Go through our list of things to do, and add them to an array
  _.each(toDos, (value, toDo) => {
    var tmp;
    
    fixtureOps.push(toDoList[toDo]);
  });
  
  return fixtureOps;
};

// Test Setup and Teardown
let initFixtures = function initFixtures() {
  let options = _.merge({init: true}, _.transform(arguments, (result, val) => {
    result[val] = true;
  }));
  let fixtureOps = getFixtureOps(options);
  
  return sequence(fixtureOps);
};

/**
 * Setup Integration Tests
 * Setup takes a list of arguments like: 'default', 'user:role', 'user'
 * Setup does 'init' (DB) by default
 * @returns {Function}
 */
let setup = function setup() {
  const self = this;
  let args = arguments;
  
  return (done) => {
    return Models.init().then(() => {
      return initFixtures.apply(self, args);
    }).then(() => {
      done();
    }).catch(done);
  };
};

let teardown = function teardown(done) {
  migration.reset().then(() => {
    done();
  }).catch(done);
};

export default {
  teardown: teardown,
  setup: setup,
  
  initFixtures: initFixtures,
  initData: initData,
  clearData: clearData,
  
  fixtures: fixtures,
  
  Data: Data,
  
  context: {
    internal: {context: {internal: true}},
    admin: {context: {user: 1}},
    staff: {context: {user: 3}},
    creator: {context: {user: 4}}
  },
  users: {
    ids: {
      admin: 1,
      admin2: 2,
      staff: 3,
      creator: 4,
      user: 5
    }
  },
  roles: {
    ids: {
      admin: 1,
      staff: 2,
      creator: 3
    }
  },
  
  cacheRules: {
    public: 'public, max-age=0',
    hour: 'public, max-age=' + 3600,
    day: 'public, max-age=' + 86400,
    year: 'public, max-age=' + 31536000,
    private: 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'
  }
};