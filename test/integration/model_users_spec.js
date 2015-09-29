/*globals describe, before, beforeEach, afterEach, it*/
import should from 'should';
import Promise from 'bluebird';
import sinon from 'sinon';
import uuid from 'node-uuid';
import _ from 'lodash';
import testUtils from '../utils';

// Stuff to test
import utils from '../../core/utils';
import { User } from '../../core/models/user';
import { Role } from '../../core/models/role';
import events from '../../core/events';

let context = testUtils.context.admin;
let sandbox = sinon.sandbox.create();

describe('User Model', function run() {
  var eventSpy;
  //Keep the DB clean
  before(testUtils.teardown);
  afterEach(testUtils.teardown);
  afterEach(() => {
    sandbox.restore();
  });
  
  before(() => {
    should.exist(User);
  });
  
  beforeEach(() => {
    eventSpy = sandbox.spy(events, 'emit');
  });
  
  describe('Registration', function runRegistration() {
    beforeEach(testUtils.setup('roles'));
    
    it('can add first', (done) => {
      var userData = testUtils.Data.forModel.users[0];

      User.add(userData, context).then((createdUser) => {
        should.exist(createdUser);
        createdUser.has('uuid').should.equal(true);
        createdUser.attributes.password.should.not.equal(userData.password, 'password was hashed');
        createdUser.attributes.email.should.eql(userData.email, 'email address correct');

        done();
      }).catch(done);
    });
    
    it('does NOT lowercase email', (done) => {
      let userData = testUtils.Data.forModel.users[0];

      User.add(userData, context).then((createdUser) => {
        should.exist(createdUser);
        createdUser.has('uuid').should.equal(true);
        createdUser.attributes.email.should.eql(userData.email, 'email address correct');
        done();
      }).catch(done);
    });
    
    it('can add first', (done) => {
      var userData = testUtils.Data.forModel.users[0];

      User.add(userData, context).then((createdUser) => {
        should.exist(createdUser);
        createdUser.has('uuid').should.equal(true);
        createdUser.attributes.password.should.not.equal(userData.password, 'password was hashed');
        createdUser.attributes.email.should.eql(userData.email, 'email address correct');

        done();
      }).catch(done);
    });
  });
  
  describe('Basic Operations', () => {
    beforeEach(testUtils.setup('users_roles'));
    
    it('sets last login time on successful login', (done) => {
      var userData = testUtils.Data.forModel.users[0];

      User.check({email: userData.email, password: userData.password}).then(function (activeUser) {
        should.exist(activeUser.get('last_login'));
        done();
      }).catch(done);
    });
    
    it('converts fetched dateTime fields to Date objects', (done) => {
      var userData = testUtils.Data.forModel.users[0];

      User.check({email: userData.email, password: userData.password}).then((user) => {
        return User.findOne({id: user.id});
      }).then((user) => {
        let lastLogin;
        let createdAt;
        let updatedAt;

        should.exist(user);

        lastLogin = user.get('last_login');
        createdAt = user.get('created_at');
        updatedAt = user.get('updated_at');

        lastLogin.should.be.an.instanceof(Date);
        createdAt.should.be.an.instanceof(Date);
        updatedAt.should.be.an.instanceof(Date);

        done();
      }).catch(done);
    });
  });
});