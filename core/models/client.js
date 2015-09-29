import appBookshelf from './base';

let Client = appBookshelf.Model.extend({
  tableName: 'clients'
});

let Clients = appBookshelf.Collection.extend({
  model: Client
});

export default {
  Client: appBookshelf.model('Client', Client),
  Clients: appBookshelf.collection('Clients', Clients)
};