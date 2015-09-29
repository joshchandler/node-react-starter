/*global describe, it*/
import should from 'should';

// Stuff to test

import core from '../../core';

describe('Module', () => {
  describe('Setup', () => {
    it('should resolve with a server instance', (done) => {
      core().then((appServer) => {
        should.exist(appServer);
        
        done();
      }).catch(done);
    });
    
    it('should expose an express instance', (done) => {
      core().then((appServer) => {
        should.exist(appServer);
        should.exist(appServer.rootApp);
        
        done();
      }).catch(done);
    });
    
    it('should expose configuration values', (done) => {
      core().then((appServer) => {
        should.exist(appServer);
        should.exist(appServer.config);
        should.exist(appServer.config.paths);

        done();
      }).catch(done);
    });
    
    it('should have start/stop/restart functions', (done) => {
      core().then((appServer) => {
        should.exist(appServer);
        appServer.start.should.be.a.Function;
        appServer.restart.should.be.a.Function;
        appServer.stop.should.be.a.Function;

        done();
      }).catch(done);
    });
  });
});