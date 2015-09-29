import _ from 'lodash';
import Promise from 'bluebird';
import nodemailer from 'nodemailer';
import validator from 'validator';
import ConfigManager from './config';

let config = ConfigManager.config;

class AppMailer {
  constructor(opts) {
    opts = opts || {};
    this.transport = opts.transport || null;
  }
  
  init() {
    const self = this;
    self.state = {};
    if (config.mail && config.mail.transport) {
      this.createTransport();
      return Promise.resolve();
    }
    
    self.transport = nodemailer.createTransport('DIRECT');
    self.state.usingDirect = true;
    
    return Promise.resolve();
  }
  
  createTransport() {
    this.transport = nodemailer.createTransport(config.mail.transport, _.clone(config.mail.options) || {});
  }
  
  fromEmail() {
    let from = config.mail && (config.mail.from || config.mail.fromaddress);
    
    // If we don't have a from address at all
    if (!from) {
      from = 'noreply@' + this.getDomain();
    }
    
    return from;
  }
  
  getDomain() {
    var domain = config.url.match(new RegExp('^https?://([^/:?#]+)(?:[/:?#]|$)', 'i'));
    return domain && domain[1];
  }
  
  send(message) {
    const self = this;
    var to;
    var sendMail;
    
    message = message || {};
    to = message.to || false;
  
    if (!this.transport) {
      return Promise.reject(new Error('Email Error: no e-mail transport configured.'));
    }
    if (!(message && message.subject && message.html && message.to)) {
      return Promise.reject(new Error('Email Error: Incomplete message data.'));
    }
    sendMail = Promise.promisify(self.transport.sendMail.bind(self.transport));

    message = _.extend(message, {
      from: self.from(),
      to: to,
      generateTextFromHTML: true,
      encoding: 'base64'
    });

    return new Promise((resolve, reject) => {
      sendMail(message, (error, response) => {
        if (error) {
          return reject(new Error(error));
        }

        if (self.transport.transportType !== 'DIRECT') {
          return resolve(response);
        }

        response.statusHandler.once('failed', (data) => {
          let reason = 'Email Error: Failed sending email';

          if (data.error && data.error.errno === 'ENOTFOUND') {
            reason += ': there is no mail server at this address: ' + data.domain;
          }
          reason += '.';
          return reject(new Error(reason));
        });

        response.statusHandler.once('requeue', (data) => {
          let errorMessage = 'Email Error: message was not sent, requeued.  Probably will not be sent. :(';

          if (data.error && data.error.message) {
            errorMessage += '\nMore info: ' + data.error.message;
          }

          return reject(new Error(errorMessage));
        });

        response.statusHandler.once('sent', () => {
          return resolve('Message was accepted by the mail server. Make sure to check inbox and spam folders. :)');
        });
      });
    });
  }
}

export default new AppMailer();
