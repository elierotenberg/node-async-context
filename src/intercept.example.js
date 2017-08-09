import intercept, { effect, fork } from './intercept';
const print = effect('print');
const sleep = effect('sleep');
const get = effect('get');
const set = effect('set');

function* initializeStores(values) {
  for (const key of Object.keys(values)) {
    yield set(key, values[key]);
  }
}

function* displayStores(keys) {
  for (const key of keys) {
    yield print(`${key}: ${yield get(key)}`);
  }
}

function* doWork() {
  yield* initializeStores({
    foo: 'bar',
    fizz: 'buzz',
  });
  return yield fork({
    print: (...args) => resume => {
      console.log('(within inner context)', ...args);
      resume();
    },
  })(function*() {
    yield sleep(1000);
    yield* displayStores(['foo', 'fizz']);
    return yield Promise.resolve(42);
  });
}

(async () => {
  const store = {};

  const res = await intercept({
    print: (...args) => resume => {
      console.log('(within outer context)', ...args);
      resume();
    },
    sleep: ms => resume => {
      console.log('sleep', ms);
      setTimeout(resume, ms);
    },
    get: key => resume => setTimeout(() => resume(store[key]), 500), // simulate lag
    set: (key, value) => resume => {
      store[key] = value;
      setTimeout(resume, 500); // simulate lag
    },
  })(doWork);
  console.log({ res });
})();
