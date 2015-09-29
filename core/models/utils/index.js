import _ from 'lodash';
import Promise from 'bluebird';
import ConfigManager from '../../config';
import schema from '../data/schema';
import clients from './clients';

let config = ConfigManager.config;
let dbConfig;

function addTableColumn(tablename, table, columnname) {
  let column;
  let columnSpec = schema[tablename][columnname];

  // creation distinguishes between text with fieldtype, string with maxlength and all others
  if (columnSpec.type === 'text' && columnSpec.hasOwnProperty('fieldtype')) {
    column = table[columnSpec.type](columnname, columnSpec.fieldtype);
  } else if (columnSpec.type === 'string' && columnSpec.hasOwnProperty('maxlength')) {
    column = table[columnSpec.type](columnname, columnSpec.maxlength);
  } else {
    column = table[columnSpec.type](columnname);
  }

  if (columnSpec.hasOwnProperty('nullable') && columnSpec.nullable === true) {
    column.nullable();
  } else {
    column.notNullable();
  }
  if (columnSpec.hasOwnProperty('primary') && columnSpec.primary === true) {
    column.primary();
  }
  if (columnSpec.hasOwnProperty('unique') && columnSpec.unique) {
    column.unique();
  }
  if (columnSpec.hasOwnProperty('unsigned') && columnSpec.unsigned) {
    column.unsigned();
  }
  if (columnSpec.hasOwnProperty('references')) {
    // check if table exists?
    column.references(columnSpec.references);
  }
  if (columnSpec.hasOwnProperty('defaultTo')) {
    column.defaultTo(columnSpec.defaultTo);
  }
}

function addColumn(table, column) {
  return config.database.knex.schema.table(table, (t) => {
    addTableColumn(table, t, column);
  });
}

function addUnique(table, column) {
  return config.database.knex.schema.table(table, (table) => {
    table.unique(column);
  });
}

function dropUnique(table, column) {
  return config.database.knex.schema.table(table, (table) => {
    table.dropUnique(column);
  });
}

function createTable(table) {
  return config.database.knex.schema.createTable(table, (t) => {
    let columnKeys = _.keys(schema[table]);
    _.each(columnKeys, (column) => {
      return addTableColumn(table, t, column);
    });
  });
}

function deleteTable(table) {
  return config.database.knex.schema.dropTableIfExists(table);
}

function getTables() {
  var client = config.database.client;

  if (_.contains(_.keys(clients), client)) {
    return clients[client].getTables();
  }

  return Promise.reject('No support for database client ' + client);
}

function getIndexes(table) {
  var client = config.database.client;

  if (_.contains(_.keys(clients), client)) {
    return clients[client].getIndexes(table);
  }

  return Promise.reject('No support for database client ' + client);
}

function getColumns(table) {
  var client = config.database.client;

  if (_.contains(_.keys(clients), client)) {
    return clients[client].getColumns(table);
  }

  return Promise.reject('No support for database client ' + client);
}

function checkTables() {
  var client = config.database.client;

  if (client === 'mysql') {
    return clients[client].checkPostTable();
  }
}

export default {
  checkTables: checkTables,
  createTable: createTable,
  deleteTable: deleteTable,
  getTables: getTables,
  getIndexes: getIndexes,
  addUnique: addUnique,
  dropUnique: dropUnique,
  addColumn: addColumn,
  getColumns: getColumns
};