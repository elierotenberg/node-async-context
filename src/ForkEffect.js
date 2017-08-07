class ForkEffect {
  constructor(handlers, name, genFn) {
    this.handlers = handlers;
    this.name = name;
    this.genFn = genFn;
  }
}

export default ForkEffect;
