import _ from 'lodash';
import uuid from 'node-uuid';
import utils from '../../../core/utils';

let Data = {};

Data.Content = {
  // Password = Sl1m3rson
  users: [
    {
      first_name: 'Joshua',
      last_name: 'Chandler',
      username: 'joshchandler',
      email: 'joshchandler@example.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    },
    {
      first_name: 'Dave',
      last_name: 'Connis',
      username: 'daveconnis',
      email: 'daveconnis@example.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    },
    {
      first_name: 'Jimothy',
      last_name: 'Bogendath',
      username: 'jimothybogendath',
      email: 'jbOgendAth@example.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    },
    {
      first_name: 'Slime',
      last_name: 'McEctoplasm',
      username: 'slimermcectoplasm',
      email: 'smcectoplasm@example.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    },
    {
      first_name: 'Ivan',
      last_name: 'Email',
      username: 'ivanemail',
      email: 'info@musetic.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    }
  ],
  roles: [
    {
      name: 'Admin',
      description: 'Administrators'
    },
    {
      name: 'Staff',
      description: 'Staff'
    }
  ]
};


Data.forKnex = (() => {
  let users;
  let roles;
  let roles_users;
  let clients;
  
  function createBasic(overrides) {
    return _.defaults(overrides, {
      uuid: uuid.v4(),
      created_by: 1,
      created_at: new Date(),
      updated_by: 1,
      updated_at: new Date()
    });
  }
  
  function createUser(overrides) {
    return _.defaults(overrides, {
      uuid: uuid.v4(),
      status: 'active',
      created_by: 1,
      created_at: new Date()
    });
  }
  
  function createGenericUser(uniqueInteger) {
    return createUser({
      name: 'Josh Chandler',
      username: 'joshchandler',
      email: 'joshchandler' + uniqueInteger + '@example.com',
      password: '$2a$10$.pZeeBE0gHXd0PTnbT/ph.GEKgd0Wd3q2pWna3ynTGBkPKnGIKZL6'
    });
  }
  
  function createToken(overrides) {
    return _.defaults(overrides, {
      token: uuid.v4(),
      client_id: 1,
      expires: Date.now() + globalUtils.ONE_DAY_MS
    });
  }
  
  roles = [
    createBasic(Data.Content.roles[0]),
    createBasic(Data.Content.roles[1]),
    createBasic(Data.Content.roles[2]),
  ];
  
  users = [
    createUser(Data.Content.users[0]),
    createUser(Data.Content.users[1]),
    createUser(Data.Content.users[2]),
    createUser(Data.Content.users[3])
  ];

  clients = [
    createBasic({name: 'Admin', secret: 'not_available'})
  ];
  
  roles_users = [
    {user_id: 1, role_id: 1},
    {user_id: 2, role_id: 1},
    {user_id: 3, role_id: 2},
    {user_id: 4, role_id: 3}
  ];
  
  return {
    createBasic: createBasic,
    createUser: createUser,
    createGenericUser: createGenericUser,
    createRole: createBasic,
    createToken: createToken,
    
    users: users,
    roles: roles,
    roles_users: roles_users,
    clients: clients
  };
}());

Data.forModel = (() => {
  let users;
  let roles;
  
  users = _.map(Data.Content.users, (user) => {
    user = _.pick(user, 'username', 'first_name', 'last_name', 'email');
    
    return _.defaults({
      password: 'Sl1m3rson'
    }, user);
  });
  
  roles = _.map(Data.Content.roles, (role, id) => {
    return _.extend({}, role, {id: id + 1});
  });
  
  return {
    users: users,
    roles: roles
  };
}());

export default Data;