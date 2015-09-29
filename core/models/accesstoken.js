import appBookshelf from './base';
import Basetoken from './base/token';

let Accesstoken = Basetoken.extend({
  tableName: 'accesstokens'
});

let Accesstokens = appBookshelf.Collection.extend({
  model: Accesstoken
});

export default {
  Accesstoken: appBookshelf.model('Accesstoken', Accesstoken),
  Accesstokens: appBookshelf.collection('Accesstokens', Accesstokens)
};