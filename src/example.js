import { using, use, fork } from './lib';

const read = use('read');
const write = use('write');
const sleep = use('sleep');
const print = use('print');

function* writeValues() {
  yield sleep(1000);
  yield write('foo', 'bar');
  yield sleep(1000);
  yield write('fizz', 'buzz');
}

function* readValues() {
  return [yield read('foo'), yield read('fizz')];
}

const store = {};

using({
  print: (...args) => resume => {
    console.log(...args);
    resume(...args);
  },
  sleep: ms => resume => setTimeout(resume, ms),
}).perform(function*() {
  yield print('outer context');
  return yield fork({
    read: key => resume => {
      const value = store[key];
      resume(value);
    },
    write: (key, value) => resume => {
      store[key] = value;
      resume(value);
    },
  })(function*() {
    yield print('inner context');
    yield* writeValues();
    const [foo, bar] = yield* readValues();
    return yield print([foo, bar].join(', '));
  });
})();
