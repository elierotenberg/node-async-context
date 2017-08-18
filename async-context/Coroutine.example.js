process.on('unhandledRejection', err => {
  throw err;
});

const Monitor = require('./Monitor');
const Coroutine = require('./Coroutine');

const monitor = new Monitor();

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

const initFoo = async () => {
  await sleep(100);
  Coroutine.context.foo = 'bar';
};

const initFizz = async () => {
  await sleep(300);
  Coroutine.context.fizz = 'buzz';
};

const logContext = () => Monitor.log({ context: Coroutine.context });

// const coroutine = new Coroutine(async fn, monitor)
// await coroutine(props);

Coroutine.spawn(
  async () => {
    logContext();
    await initFoo();
    logContext();
    await Coroutine.spawn(initFizz);
    logContext();
    return Coroutine.context.foo + Coroutine.context.fizz;
  },
  {
    foo: 'hello',
    fizz: 'world',
  },
  monitor,
).then(output => console.log({ output }));
