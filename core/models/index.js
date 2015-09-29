import _ from 'lodash';
import requireTree from '../utils/require-tree';

let models = {
  excludeFiles: [
    '_messages', 
    'base', 
    'data',
    'fixtures',
    'migration', 
    'utils', 
    'index.js'
  ],
  
  /**
   * Scan all files in this directory and then require each one and cache
   * the objects exported onto this `models` object so that every other
   * module can safely access models without fear of introducing circular
   * dependency issues
   * @returns {Promise}
   */
  init: function init() {
    const self = this;
    
    // One off includes of Base file.
    self.Base = require('./base');
    
    // Require all files in this directory
    return requireTree.readAll(__dirname, {followSymlinks: false}).then(function then(modelFiles) {
      // For each found file, excluding those we don't want,
      // we will require it and cache it here.
      _.each(modelFiles, function each(path, fileName) {
        // Return early if this fileName is one of the ones we want
        // to exclude.
        if (_.contains(self.excludeFiles, fileName)) {
          return;
        }
        
        // Require the file.
        let file = require(path);

        // Cache its `export` object onto this object.
        _.extend(self, file);
      });
      
      return;
    });
  }
};

export default models;