import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';

let readdirAsync = Promise.promisify(fs.readdir);
let lstatAsync = Promise.promisify(fs.lstat);
let readlinkAsync = Promise.promisify(fs.readlink);

let parsePackageJson = (path, messages) => {
  // Default the messages if non were passed
  messages = messages || {
    errors: [],
    warns: []
  };
  
  let jsonContainer;
  
  return new Promise((resolve) => {
    fs.readFile(path, (error, data) => {
      if (error) {
        messages.errors.push({
          message: 'Could not read package.json file',
          context: path
        });
        resolve(false);
        return;
      }
    });
  });
};

let readDir = (dir, options, depth, messages) => {
  depth = depth || 0;
  messages = messages || {
    errors: [],
    warns: []
  };
  
  options = _.extend({
    index: true,
    followSymlinks: true
  }, options);
  
  if (depth > 1) {
    return Promise.resolve(null);
  }
  
  return readdirAsync(dir).then((files) => {
    files = files || [];
    
    return Promise.reduce(files, (results, file) => {
      let fpath = path.join(dir, file);
      
      return lstatAsync(fpath).then((result) => {
        if (result.isDirectory()) {
          return readDir(fpath, options, depth + 1, messages);
        } else if (options.followSymlinks && result.isSymbolicLink()) {
          return readlinkAsync(fpath).then((linkPath) => {
            linkPath = path.resolve(dir, linkPath);
            
            return lstatAsync(linkPath).then((result) => {
              if (result.isFile()) {
                return linkPath;
              }
              
              return readDir(linkPath, options, depth + 1, messages);
            });
          });
        } else if (depth === 1 && file === 'package.json') {
          return parsePackageJson(fpath, messages);
        } else {
          return fpath;
        }
      }).then((result) => {
        results[file] = result;
        
        return results;
      });
    }, {});
  });
};

let readAll = (dir, options, depth) => {
  // Start with clean messages, pass down along traversal
  let messages = {
    errors: [], 
    warns: []
  };
  
  return readDir(dir, options, depth, messages).then((paths) => {
    paths._messages = messages;
    
    return paths;
  }).catch(() => {
    return {_messages: messages};
  });
};

export default {
  parsePackageJson: parsePackageJson,
  readDir: readDir,
  readAll: readAll
}