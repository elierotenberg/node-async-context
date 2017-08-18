const Monitor = require('./Monitor');

const monitor = new Monitor();
monitor.on('*', (event, ...args) => Monitor.log([event, args]));

process.nextTick(() => {
  setTimeout(() => void 0);
});
