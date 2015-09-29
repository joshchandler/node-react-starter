import _ from 'lodash';
import errors from '../errors';
import appBookshelf from './base';
import Promise from 'bluebird';

let Role = appBookshelf.Model.extend({
  
  tableName: 'roles',
  
  users() {
    return this.belongsToMany('User');
  }
});

let Roles = appBookshelf.Collection.extend({
  model: Role
});

export default {
  Role: appBookshelf.model('Role', Role),
  Roles: appBookshelf.collection('Roles', Roles)
};