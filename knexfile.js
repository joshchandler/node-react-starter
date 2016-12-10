// Update with your config settings.
// var path = require('path');

module.exports = {

  development: {
    client: 'mysql',
    connection: {
			host: '0.0.0.0',
      database: 'personal',
			user: 'joshua',
			password: 'password',
    },
		pool: {
			min: 2,
			max: 10
		},
		migrations: {
			tableName: 'migrations',
		},
    debug: false
  },

  // staging: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // },
  //
  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }

};
