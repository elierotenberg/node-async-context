import CallEffect from './CallEffect';
import ForkEffect from './ForkEffect';
import Context from './Context';

const use = handlerName => (...args) => new CallEffect(handlerName, args);

const using = (handlers, name) => Context.current.fork(handlers, name);

const fork = (handlers, name) => genFn => new ForkEffect(handlers, name, genFn);

export { use, using, fork };
