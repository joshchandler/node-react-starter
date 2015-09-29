import ConfigManager from '../../core/config';

process.env.NODE_ENV = 'testing';

let config = ConfigManager.set();

export default config;