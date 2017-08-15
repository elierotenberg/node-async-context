import { fork } from './Monitor';

fork(async () => {
  console.log('hello world');
}).then(
  val => console.log({ val }),
  err => {
    throw err;
  },
);
