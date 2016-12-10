export default {
  users: {
    id: {type: 'increments', nullable: false, primary: true},
    uuid: {type: 'string', maxlength: 36, nullable: false, validations: {isUUID: true}},
    first_name: {type: 'string', maxlength: 50, nullable: false},
    last_name: {type: 'string', maxlength: 50, nullable: false},
    username: {type: 'string', maxlength: 50, nullable: false, unique: true},
    password: {type: 'string', maxlength: 60, nullable: false},
    email: {type: 'string', maxlength: 250, nullable: false, unique: true, validations: {isEmail: true}},
    // image: {type: 'text', maxlength: 2000, nullable: true},
    // cover: {type: 'text', maxlength: 2000, nullable: true},
    // bio: {type: 'string', maxlength: 200, nullable: true},
    // website: {type: 'text', maxlength: 2000, nullable: true, validations: {isEmptyOrURL: true}},
    // location: {type: 'text', maxlength: 65535, nullable: true},
    // accessibility: {type: 'text', maxlength: 65535, nullable: true},
    // status: {type: 'string', maxlength: 150, nullable: false, defaultTo: 'active'},
    // language: {type: 'string', maxlength: 6, nullable: false, defaultTo: 'en_US'},
    // meta_title: {type: 'string', maxlength: 150, nullable: true},
    // meta_description: {type: 'string', maxlength: 200, nullable: true},
    // last_login: {type: 'dateTime', nullable: true},
    created_at: {type: 'dateTime', nullable: false},
    // created_by: {type: 'integer', nullable: false},
    updated_at: {type: 'dateTime', nullable: true},
    // updated_by: {type: 'integer', nullable: true}
  },
  // roles: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   uuid: {type: 'string', maxlength: 36, nullable: false, validations: {isUUID: true}},
  //   name: {type: 'string', maxlength: 150, nullable: false},
  //   description: {type: 'string', maxlength: 200, nullable: true},
  //   created_at: {type: 'dateTime',  nullable: false},
  //   created_by: {type: 'integer',  nullable: false},
  //   updated_at: {type: 'dateTime',  nullable: true},
  //   updated_by: {type: 'integer',  nullable: true}
  // },
  // roles_users: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   role_id: {type: 'integer', nullable: false},
  //   user_id: {type: 'integer', nullable: false}
  // },
  // settings: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   uuid: {type: 'string', maxlength: 36, nullable: false, validations: {isUUID: true}},
  //   key: {type: 'string', maxlength: 150, nullable: false, unique: true},
  //   value: {type: 'text', maxlength: 65535, nullable: true},
  //   type: {type: 'string', maxlength: 150, nullable: false, defaultTo: 'core', validations: {isIn: [['core']]}},
  //   created_at: {type: 'dateTime', nullable: false},
  //   created_by: {type: 'integer', nullable: false},
  //   updated_at: {type: 'dateTime', nullable: true},
  //   updated_by: {type: 'integer', nullable: true}
  // },
  // clients: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   uuid: {type: 'string', maxlength: 36, nullable: false},
  //   name: {type: 'string', maxlength: 150, nullable: false, unique: true},
  //   secret: {type: 'string', maxlength: 150, nullable: false, unique: true},
  //   created_at: {type: 'dateTime', nullable: false},
  //   created_by: {type: 'integer', nullable: false},
  //   updated_at: {type: 'dateTime', nullable: true},
  //   updated_by: {type: 'integer', nullable: true}
  // },
  // accesstokens: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   token: {type: 'string', nullable: false, unique: true},
  //   user_id: {type: 'integer', nullable: false, unsigned: true, references: 'users.id'},
  //   client_id: {type: 'integer', nullable: false, unsigned: true, references: 'clients.id'},
  //   expires: {type: 'bigInteger', nullable: false}
  // },
  // refreshtokens: {
  //   id: {type: 'increments', nullable: false, primary: true},
  //   token: {type: 'string', nullable: false, unique: true},
  //   user_id: {type: 'integer', nullable: false, unsigned: true, references: 'users.id'},
  //   client_id: {type: 'integer', nullable: false, unsigned: true, references: 'clients.id'},
  //   expires: {type: 'bigInteger', nullable: false}
  // }
};