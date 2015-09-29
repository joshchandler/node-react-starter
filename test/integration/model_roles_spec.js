/*globals describe, it, before, beforeEach, afterEach*/
import testUtils from '../utils';
import should from 'should';

// Stuff to test

import { Role } from '../../core/models/role';
let context = testUtils.context.admin;

describe('Role Model', () => {
	// Keep the DB clean
  before(testUtils.teardown);
  afterEach(testUtils.teardown);
	
  beforeEach(testUtils.setup(['roles']));
	
  before(() => {
    should.exist(Role);
  });
	
  it('can findAll', (done) => {
    Role.findAll().then((foundRoles) => {
      should.exist(foundRoles);

      foundRoles.models.length.should.be.above(0);

      done();
    }).catch(done);
  });
  
  it('can findOne', (done) => {
    Role.findOne({id: 1}).then((foundRole) => {
      should.exist(foundRole);
      foundRole.get('created_at').should.be.an.instanceof(Date);
      
      done();
    }).catch(done);
  });
  
  it('can edit', (done) => {
    Role.findOne({id: 1}).then((foundRole) => {
      should.exist(foundRole);

      return foundRole.set({name: 'updated'}).save(null, context);
    }).then(() => {
      return Role.findOne({id: 1});
    }).then((updatedRole) => {
      should.exist(updatedRole);

      updatedRole.get('name').should.equal('updated');

      done();
    }).catch(done);
  });
  
  it('can add', function (done) {
    var newRole = {
      name: 'test1',
      description: 'test1 description'
    };

    Role.add(newRole, context).then(function (createdRole) {
      should.exist(createdRole);

      createdRole.attributes.name.should.equal(newRole.name);
      createdRole.attributes.description.should.equal(newRole.description);

      done();
    }).catch(done);
  });
  
  it('can destroy', (done) => {
    var firstRole = {id: 1};

    Role.findOne(firstRole).then((foundRole) => {
      should.exist(foundRole);
      foundRole.attributes.id.should.equal(firstRole.id);

      return Role.destroy(firstRole);
    }).then((response) => {
      response.toJSON().should.be.empty;
      return Role.findOne(firstRole);
    }).then((newResults) => {
      should.equal(newResults, null);

      done();
    }).catch(done);
  });
});