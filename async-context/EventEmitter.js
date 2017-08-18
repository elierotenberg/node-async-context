const BaseEventEmitter = require('events');
const inspectable = require('./inspectable');

const EventEmitter = inspectable(
  class extends BaseEventEmitter {
    emit(...args) {
      super.emit('*', ...args);
      super.emit(...args);
    }

    toJS() {
      return {
        listeners: this.eventNames()
          .map(eventName => [eventName, this.listeners(eventName)])
          .reduce((obj, [v, k]) => {
            obj[k] = inspectable.toJS(v);
            return obj;
          }, {}),
      };
    }
  },
);

module.exports = EventEmitter;
