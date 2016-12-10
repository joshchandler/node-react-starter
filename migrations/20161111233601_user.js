
exports.up = function(knex, Promise) {
  return Promise.all([knex.schema.createTable('users', function (table) {
    table.increments();
		table.string('uuid');
		table.string('first_name');
		table.string('last_name');
		table.string('username');
		table.string('password');
		table.string('email');
		table.timestamps()
  })]);
};

exports.down = function(knex, Promise) {
  return Promise.all([knex.schema.dropTable('users')]);
};
