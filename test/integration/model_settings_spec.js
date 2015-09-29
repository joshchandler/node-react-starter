/*globals describe, before, beforeEach, afterEach, it*/
import testUtils from '../utils';
import should from 'should';
import sinon from 'sinon';

// Stuff to test
import { Settings } from '../../core/models/settings';
import config from '../utils/config';
import events from '../../core/events';

let sandbox = sinon.sandbox.create();
let context = testUtils.context.admin;

describe('Settings Model', () => {
  var eventSpy;
  
  // Keep the DB clean
  before(testUtils.teardown);
  afterEach(testUtils.teardown);
  beforeEach(testUtils.setup('settings'));
  
  before(() => {
    should.exist(Settings);
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  beforeEach(() => {
    eventSpy = sandbox.spy(events, 'emit');
  });
  
  describe('API', () => {
    it('can findAll', (done) => {
      Settings.findAll().then((results) => {
        should.exist(results);
        
        results.length.should.be.above(0);
        
        done();
      }).catch(done);
    });
    
    it('can findOne', (done) => {
      var firstSetting;
      
      Settings.findAll().then((results) => {
        should.exist(results);
        
        results.length.should.be.above(0);
        
        firstSetting = results.models[0];
        
        return Settings.findOne(firstSetting.attributes.key);
      }).then((found) => {
        should.exist(found);
        
        should(found.get('value')).equal(firstSetting.attributes.value);
        found.get('created_at').should.be.an.instanceof(Date);
        
        done();
      }).catch(done);
    });
    
    it('can edit single', (done) => {
      Settings.findAll().then((results) => {
        should.exist(results);
        
        results.length.should.be.above(0);
        
        return Settings.edit({key: 'databaseVersion', value: '0000'}, context);
      }).then((edited) => {
        should.exist(edited);
        
        edited.length.should.equal(1);
        
        edited = edited[0];
        
        edited.attributes.key.should.equal('databaseVersion');
        edited.attributes.value.should.equal('0000');
        
        eventSpy.calledTwice.should.be.true;
        eventSpy.firstCall.calledWith('settings.edited').should.be.true;
        eventSpy.secondCall.calledWith('settings.databaseVersion.edited').should.be.true;
        
        done();
      }).catch(done);
    });
    
    it('can add', (done) => {
      var newSetting = {
        key: 'TestSetting',
        value: 'Test Content'
      };
      
      Settings.add(newSetting, context).then((createdSetting) => {
        should.exist(createdSetting);
        createdSetting.has('uuid').should.equal(true);
        createdSetting.attributes.key.should.equal(newSetting.key, 'key is correct');
        createdSetting.attributes.value.should.equal(newSetting.value, 'value is correct');
        createdSetting.attributes.type.should.equal('core');

        eventSpy.calledTwice.should.be.true;
        eventSpy.firstCall.calledWith('settings.added').should.be.true;
        eventSpy.secondCall.calledWith('settings.TestSetting.added').should.be.true;

        done();
      }).catch(done);
    });
  });
  
  describe('populating defaults from default-settings', () => {
    beforeEach((done) => {
      config.database.knex('settings').truncate().then(() => {
        done();
      });
    });
    
    it('populates any unset settings from the object', (done) => {
      Settings.findAll().then((allSettings) => {
        allSettings.length.should.equal(0);
        return Settings.populateDefaults();
      }).then(() => {
        return Settings.findAll();
      }).then((allSettings) => {
        allSettings.length.should.be.above(0);
        
        return Settings.findOne('databaseVersion');
      }).then((databaseSetting) => {
        databaseSetting.get('value').should.equal('001');
        done();
      }).catch(done);
    });
    
    it('doesn\'t overwrite any existing settings', (done) => {
      Settings.add({key: 'databaseVersion', value: '005'}, context).then(() => {
        return Settings.populateDefaults();
      }).then(() => {
        return Settings.findOne('databaseVersion');
      }).then((databaseSetting) => {
        databaseSetting.get('value').should.equal('005');
        done();
      }).catch(done);
    });
  });
});