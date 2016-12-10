import path from 'path';
import url from 'url';
import knexfile from './knexfile';
import packageInfo from './package.json';

const appRoot = path.resolve(__dirname);
const corePath = path.resolve(appRoot, 'core/');
const clientPath = path.resolve(appRoot, 'client/');

export default {
  core: {
    version: packageInfo.version,
    dbVersion: '001',
    paths: {
      appRoot:          appRoot,
      corePath:         corePath,
      clientPath:       clientPath,
      subdir:           '',
      configPath:       path.resolve(__dirname),

      templatesPath:    path.join(corePath, '/templates/'),
      stylesPath:       path.join(clientPath, '/styles/'),
      publicPath:       path.resolve(appRoot, 'public/')
    },
    uploads: {
      // Used by the upload API to limit uploads to images
      extensions: ['.jpg', '.jpeg', '.gif', '.png', '.svg', '.svgz'],
      contentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
    }
  },
  development: {
    env: 'development',
    url: process.env.SITEURL,
/*     mail: {}, */
    database: knexfile.development,

    server: {
      host: process.env.IP || '127.0.0.1',
      port: process.env.PORT || '5000'
    },
    logging: true
  },
  testing: {
    env: 'testing',
    url: process.env.SITEURL,
/*     mail: {}, */
    database: {
      client: 'sqlite3',
      connection: {
        filename: path.join(__dirname, 'test.db')
      },
      debug: false
    },
    
    server: {
      host: process.env.IP || '127.0.0.1',
      port: process.env.PORT || '5000'
    },
    logging: true
  },
  
  staging: {
    env: 'staging',
    url: process.env.SITEURL,
    database: {
      client: 'postgresql',
      connection: {
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASS,
        database: process.env.DBNAME,
        ssl: true,
        charset: 'utf8'
      },
      debug: false
    },
    
    server: {
      host: process.env.IP || '0.0.0.0',
      port: process.env.PORT || '5000'
    },
    logging: true
  },
  /**
   * Production
   * When running this application in the wild, use the production environment.
   * Configure your URL and mail settings here.
   */
  production: {
    env: 'production',
    url: process.env.SITEURL,
/*     mail: {}, */
    database: {
      client: 'postgresql',
      connection: {
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASS,
        database: process.env.DBNAME,
        ssl: true,
        charset: 'utf8'
      },
      debug: false
    },

    server: {
      host: '0.0.0.0',
      port: process.env.PORT
    }
  }
};