/*globals describe, afterEach, it*/
import should from 'should';
import Promise from 'bluebird';

// Stuff to test

import mailer from '../../core/mail';
import ConfigManager from '../../core/config';

let config = ConfigManager.config;

let SMTP = {
  transport: 'SMTP',
  options: {
    service: 'Gmail',
    auth: {
      user: 'nil',
      pass: '123'
    }
  }
};

describe('Mail', () => {
  afterEach(() => {
    ConfigManager.set({mail: null});
  });
  
  it('should attach mail provider to the instance', () => {
    should.exist(mailer);
    mailer.should.have.property('init');
    mailer.should.have.property('transport');
    mailer.should.have.property('send').and.be.a.function;
  });
  
  it('should setup SMTP transport on initialization', (done) => {
    ConfigManager.set({mail: SMTP});
    mailer.init().then(() => {
      mailer.should.have.property('transport');
      mailer.transport.transporter.should.eql('SMTP');
      mailer.transport.sendMail.should.be.a.function;
      done();
    }).catch(done);
  });
  
  it('should use direct if not specified in config', (done) => {
    ConfigManager.set({mail: {}});
    mailer.init().then(() => {
      mailer.should.have.property('transport');
      mailer.transport.transporter.should.eql('DIRECT');
      done();
    }).catch(done);
  });
  
  it('should fail to send messages when given insufficient data', (done) => {
    Promise.settle([
      mailer.send(),
      mailer.send({}),
      mailer.send({subject: '123'}),
      mailer.send({subject: '', html: '123'})
    ]).then((descriptors) => {
      descriptors.forEach((d) => {
        d.isRejected().should.be.true;
        d.reason().should.be.an.instanceOf(Error);
        d.reason().message.should.eql('Email Error: Incomplete message data.');
      });
      done();
    }).catch(done);
  });
});