import chalk from 'chalk';
import Promise from 'bluebird';
import fs from 'fs';
import logging from 'winston';
import ConfigManager from './config';

let config = ConfigManager.config;


export default class Server {
  constructor(rootApp) {
    this.rootApp = rootApp;
    this.httpServer = null;
    this.connections = {};
    this.connectionId = 0;
    
    // Expose config module for use externally.
    this.config = config;
    
  }
  
  /**
   * Start
   * Starts the server listening on the configured port.
   * @return {Promise} Resolves once the application has started.
   */
  start() {
    const self = this;
    
    return new Promise((resolve) => {
      let socketConfig = ConfigManager.getSocket();
      
      if (socketConfig) {
        // Make sure the socket is gone before trying to create another
        try {
          fs.unlinkSync(socketConfig.path);
        } catch (e) {
          // We can ignore this.
        }
        
        self.httpServer = self.rootApp.listen(socketConfig.path);
        
        fs.chmod(socketConfig.path, socketConfig.permissions);
      } else {
        self.httpServer = self.rootApp.listen(
          config.server.port,
          config.server.host
        );
      }
      self.httpServer.on('error', (error) => {
        if (error.errno === 'EADDRINUSE') {
          errors.logError(
            '(EADDRINUSE) Cannot start.\n' +
            'Port ' + config.server.port + ' is already in use.'
          );
        } else {
          errors.logError(
            '(Code: ' + error.errno + ')\n' +
            'There was an error starting your server.\n' +
            'Please use the error code above to search for a solution.'
          );
        }
        process.exit(-1);
      });
      self.httpServer.on('connection', self.connection.bind(self));
      self.httpServer.on('listening', () => {
        self.logStartMessages();
        resolve(self);
      });
    });
  }
  
  /**
   * Stop
   * Returns a promise that will be fulfilled when the server stops.  If the server has not been started,
   * the promise will be fulfilled immediately
   * @returns {Promise} Resolves once the application has stopped
   */
  stop() {
    const self = this;
    
    return new Promise((resolve) => {
      if (self.httpServer === null) {
        resolve(self);
      } else {
        self.httpServer.close(() => {
          self.httpServer = null;
          self.logShutdownMessages();
          resolve(self);
        });
        
        self.closeConnections();
      }
    });
  }
  
  /**
   * Restart
   * Restarts the application
   * @returns {Promise} Resolves once the application has restarted
   */
  restart() {
    return this.stop().then(this.start.bind(this));
  }
  
  /**
   * Connection
   * @param {Object} socket
   */
  connection(socket) {
    const self = this;
    
    self.connectionId += 1;
    socket._appID = self.connectionId;
    
    socket.on('close', () => {
      delete self.connections[this._appID];
    });
    
    self.connections[socket._appID] = socket;
  }
  
  /**
   * Close Connections
   * Most browsers keep a persistent connection open to the server, which prevents the close callback of
   * httpServer from returning.  We need to destroy all connections manually.
   */
  closeConnections() {
    const self = this;
    
    Object.keys(self.connections).forEach((socketId) => {
      let socket = self.connections[socketId];
      
      if (socket) {
        socket.destroy();
      }
    });
  }
  
  /**
   * Log Start Messages
   */
  logStartMessages() {
    // Startup & Shutdown messages
    if (process.env.NODE_ENV === 'production') {
      console.log(
        chalk.green('Running in ' + process.env.NODE_ENV + '...'),
        '\nAvailable on ' + this.config.url,
        chalk.grey('\nCtrl+C to shut down')
      );
    } else {
      console.log(
        chalk.green('Running in ' + process.env.NODE_ENV + '...'),
        '\nListening on',
            ConfigManager.getSocket() || this.config.server.host + ':' + this.config.server.port,
        '\nUrl configured as:',
        this.config.url,
        chalk.gray('\nCtrl+C to shut down')
      );
    }

    function shutdown() {
      console.log(chalk.red('\nShut down'));
      if (process.env.NODE_ENV === 'production') {
        console.log(
          '\nNow offline'
        );
      } else {
        console.log(
          '\nRunning for ',
          Math.round(process.uptime()),
          'seconds'
        );
      }
      process.exit(0);
    }
    // ensure that the application exits correctly on Ctrl+C and SIGTERM
    process.
      removeAllListeners('SIGINT').on('SIGINT', shutdown).
      removeAllListeners('SIGTERM').on('SIGTERM', shutdown);
  }
  
  /**
   * Log Shutdown Messages
   */
  logShutdownMessages() {
    console.log(chalk.red('Closing connections'));
  }
}
