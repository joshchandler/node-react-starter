import _ from 'lodash';
import ConfigManager from '../../../config/index';

let config = ConfigManager.config;

let doRaw = function doRaw(query, fn) {
  return config.database.knex.raw(query).then((response) => {
    return fn(response);
  });
};

export function getTables() {
  return doRaw('select * from sqlite_master where type = "table"', (response) => {
    return _.reject(_.pluck(response, 'tbl_name'), (name) => {
      return name === 'sqlite_sequence';
    });
  });
};

export function getIndexes(table) {
  return doRaw('pragma index_list("' + table + '")', (response) => {
    return _.flatten(_.pluck(response, 'name'));
  });
};

export function getColumns(table) {
  return doRaw('pragma table_info("' + table + '")', (response) => {
    return _.flatten(_.pluck(response, 'name'));
  });
};
