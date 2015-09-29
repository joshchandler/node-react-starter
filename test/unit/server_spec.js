/*globals describe, it*/
import should from 'should';
import request from 'request';
import config from '../utils/config';


describe('Server', () => {
  let port = config.server.port;
  let host = config.server.host;
  let url = 'http://' + host + ':' + port;

  it('should not start a connect server when required', (done) => {
    request(url, (error, response, body) => {
      should(response).equal(undefined);
      should(body).equal(undefined);
      should(error).not.equal(undefined);
      should(error.code).equal('ECONNREFUSED');
      done();
    });
  });
});
