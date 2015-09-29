/*globals describe, beforeEach, afterEach, it*/
import should from 'should';
import sinon from 'sinon';
import _ from 'lodash';

// Stuff to test
import { Filters } from '../../core/filters';

describe('Filters', () => {
  let filters, sandbox;
  
  beforeEach(() => {
    filters = new Filters();
    sandbox = sinon.sandbox.create();
  });
  
  afterEach(() => {
    filters = null;
    sandbox.restore();
  });
  
  it('can register filters with specific priority', () => {
    let filterName = 'test';
    let filterPriority = 9;
    let testFilterHandler = sandbox.spy();
    
    filters.registerFilter(filterName, filterPriority, testFilterHandler);
    
    should.exist(filters.filterCallbacks[filterName]);
    should.exist(filters.filterCallbacks[filterName][filterPriority]);
    
    filters.filterCallbacks[filterName][filterPriority].should.containEql(testFilterHandler);
  });
  
  it('can register filters with default priority', () => {
    let filterName = 'test';
    let defaultPriority = 5;
    let testFilterHandler = sandbox.spy();
    
    filters.registerFilter(filterName, testFilterHandler);
    
    should.exist(filters.filterCallbacks[filterName]);
    should.exist(filters.filterCallbacks[filterName][defaultPriority]);
    
    filters.filterCallbacks[filterName][defaultPriority].should.containEql(testFilterHandler);
  });
  
  it('can register filters with priority null with default priority', () => {
    let filterName = 'test';
    let defaultPriority = 5;
    let testFilterHandler = sandbox.spy();
    
    filters.registerFilter(filterName, null, testFilterHandler);
    
    should.exist(filters.filterCallbacks[filterName]);
    should.exist(filters.filterCallbacks[filterName][defaultPriority]);
    
    filters.filterCallbacks[filterName][defaultPriority].should.containEql(testFilterHandler);
  });
  
  it('executes filters in priority order', (done) => {
    let filterName = 'testpriority';
    let testFilterHandler1 = sandbox.spy();
    let testFilterHandler2 = sandbox.spy();
    let testFilterHandler3 = sandbox.spy();
    
    filters.registerFilter(filterName, 0, testFilterHandler1);
    filters.registerFilter(filterName, 2, testFilterHandler2);
    filters.registerFilter(filterName, 9, testFilterHandler3);
    
    filters.doFilter(filterName, null).then(() => {
      testFilterHandler1.calledBefore(testFilterHandler2).should.equal(true);
      testFilterHandler2.calledBefore(testFilterHandler3).should.equal(true);
      
      testFilterHandler3.called.should.equal(true);
      
      done();
    });
  });
  
  it('executes filters that return a promise', (done) => {
    let filterName = 'testprioritypromise';
    let testFilterHandler1 = sinon.spy((args) => {
      return new Promise((resolve) => {
        process.nextTick(() => {
          args.filter1 = true;
          
          resolve(args);
        });
      });
    });
    let testFilterHandler2 = sinon.spy((args) => {
      args.filter2 = true;
      
      return args;
    });
    let testFilterHandler3 = sinon.spy((args) => {
      return new Promise((resolve) => {
        process.nextTick(() => {
          args.filter3 = true;
          
          resolve(args);
        });
      });
    });
    
    filters.registerFilter(filterName, 0, testFilterHandler1);
    filters.registerFilter(filterName, 2, testFilterHandler2);
    filters.registerFilter(filterName, 9, testFilterHandler3);

    filters.doFilter(filterName, {test: true}).then(function (newArgs) {
      testFilterHandler1.calledBefore(testFilterHandler2).should.equal(true);
      testFilterHandler2.calledBefore(testFilterHandler3).should.equal(true);

      testFilterHandler3.called.should.equal(true);

      newArgs.filter1.should.equal(true);
      newArgs.filter2.should.equal(true);
      newArgs.filter3.should.equal(true);

      done();
    }).catch(done);
  });
  
  it('executes filters with a context', (done) => {
    let filterName = 'textContext';
    let testFilterHandler1 = sinon.spy((args, context) => {
      args.context1 = _.isObject(context);
      return args;
    });
    let testFilterHandler2 = sinon.spy((args, context) => {
      args.context2 = _.isObject(context);
      return args;
    });
    
    filters.registerFilter(filterName, 0, testFilterHandler1);
    filters.registerFilter(filterName, 1, testFilterHandler2);
    
    filters.doFilter(filterName, {test: true}, {context: true}).then((newArgs) => {
      newArgs.context1.should.equal(true);
      newArgs.context2.should.equal(true);
      done();
    }).catch(done);
  });
});