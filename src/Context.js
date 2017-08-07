import CallEffect from './CallEffect';
import ForkEffect from './ForkEffect';

const noop = () => void 0;

class Context {
  static current = new Context({}, '<root>');

  static switch(nextContext) {
    const prevContext = this.current;
    this.current = nextContext;
    return () => this.switch(prevContext);
  }

  constructor(handlers, name = '<anonymous>') {
    this.handlers = handlers;
    this.name = name;
  }

  perform(genFn) {
    return (fn = noop) => this.step(genFn(), null, void 0, fn);
  }

  step(gen, err, val, fn) {
    const method = err ? 'throw' : 'next';
    const restoreContext = Context.switch(this);
    let g;
    try {
      g = gen[method](err || val);
    } catch (err) {
      fn(err);
      return;
    } finally {
      restoreContext();
    }
    const { value, done } = g;
    if (done) {
      fn(null, value);
      return;
    }
    if (value instanceof CallEffect) {
      const { handlerName, args } = value;
      const handler = this.handlers[handlerName];
      const resume = nextVal => this.step(gen, null, nextVal, fn);
      const interrupt = nextErr => this.step(gen, nextErr, null, fn);
      handler(...args)(resume, interrupt);
      return;
    }
    if (value instanceof ForkEffect) {
      const { handlers, name, genFn } = value;
      const forkContext = this.fork(handlers, name);
      forkContext.perform(genFn)((nextErr, nextVal) =>
        this.step(gen, nextErr, nextVal, fn),
      );
      return;
    }
    fn(
      new TypeError(
        "Only CallEffects can be yielded (created using 'use(handlerName)')",
      ),
    );
  }

  fork(handlers, name) {
    return new Context({ ...this.handlers, ...handlers }, name);
  }
}

export default Context;
