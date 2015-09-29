import appBookshelf from './base';
import Basetoken from './base/token';

let Refreshtoken = Basetoken.extend({
  tableName: 'refreshtokens'
});

let Refreshtokens = appBookshelf.Collection.extend({
  model: Refreshtoken
});

export default {
  Refreshtoken: appBookshelf.model('Refreshtoken', Refreshtoken),
  Refreshtokens: appBookshelf.model('Refreshtokens', Refreshtokens)
};