const util = require('util');

const inspectable = Class =>
  class extends Class {
    inspect() {
      return Object.assign(
        {
          constructorName: this.constructor.name,
        },
        this.toJS(),
      );
    }

    toString() {
      return util.inspect(this, { depth: null });
    }
  };

inspectable.toJS = obj => {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.toJS === 'function'
  ) {
    return obj.toJS();
  }
  return obj;
};

module.exports = inspectable;
