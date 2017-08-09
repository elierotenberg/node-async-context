const isEffect = Symbol('intercept.isEffect');
const isFork = Symbol('intercept.isFork');
export const $throw = Symbol('intercept.$throw');
export const $return = Symbol('intercept.$return');

const createChildContext = (handlers, parent) => ({
  parent,
  handlers,
});

const createChildContextWithPromise = (handlers, parent) => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  const context = createChildContext(
    {
      [$throw]: err => () => reject(err),
      [$return]: val => () => resolve(val),
      ...handlers,
    },
    parent,
  );
  return { promise, context };
};

const callNextHandler = (context, handlerName, resume, interrupt, ...args) => {
  if (!context) {
    throw new Error(`Unhandled yield: ${handlerName.toString()} (${args})`);
  }
  const bubble = () =>
    callNextHandler(context.parent, handlerName, resume, interrupt, ...args);
  if (context.handlers[handlerName]) {
    context.handlers[handlerName](...args)(resume, interrupt, bubble);
    return;
  }
  bubble();
};

export const effect = effectName => (...args) => ({
  [isEffect]: true,
  effectName,
  args,
});

export const fork = handlers => genFn => ({
  [isFork]: true,
  handlers,
  genFn,
});

const intercept = (handlers, parent = null) => genFn => {
  const gen = genFn();
  const { context, promise } = createChildContextWithPromise(handlers, parent);
  ['next', 'throw'].forEach(method => (gen[method] = gen[method].bind(gen)));
  const step = (err, val) => {
    const resume = nextVal => step(null, nextVal);
    const interrupt = nextErr => step(nextErr, null);
    const method = err ? 'throw' : 'next';
    let item;
    try {
      item = gen[method](err || val);
    } catch (err) {
      callNextHandler(context, $throw, resume, interrupt, err);
      return;
    }
    const { done, value } = item;
    if (done) {
      callNextHandler(context, $return, resume, interrupt, value);
      return;
    }
    if (typeof value.then === 'function') {
      value.then(val => resume(val), err => interrupt(err));
      return;
    }
    if (value[isFork]) {
      intercept(
        {
          ...value.handlers,
          [$return]: val => () => resume(val),
          [$throw]: err => () => interrupt(err),
        },
        context,
      )(value.genFn);
      return;
    }
    if (value[isEffect]) {
      const { effectName, args } = value;
      callNextHandler(context, effectName, resume, interrupt, ...args);
      return;
    }
    throw new TypeError('Only effects can be yielded within a coroutine.');
  };
  step(null, null);
  return promise;
};

export default intercept;
