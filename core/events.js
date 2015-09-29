import events from 'events';
import util from 'util';

let EventRegistry = function () {};

util.inherits(EventRegistry, events.EventEmitter);

export default new EventRegistry();