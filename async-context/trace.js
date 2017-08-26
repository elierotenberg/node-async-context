const getStack = function() {
  const vanillaPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (...args) => args[1];
  const err = new Error();
  Error.captureStackTrace(err, arguments.callee);
  const stack = err.stack;
  Error.prepareStackTrace = vanillaPrepareStackTrace;
  return stack;
};

const getLocation = () =>
  getStack().map(frame => ({
    fileName: frame.getFileName(),
    lineNumber: frame.getLineNumber(),
    columnNumber: frame.getColumnNumber(),
    functionName: frame.getFunctionName(),
  }));

module.exports = {
  getStack,
  getLocation,
};
