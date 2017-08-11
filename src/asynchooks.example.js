import asyncHooks from 'async_hooks';
import util from 'util';
import fs from 'fs';

let asyncHook = null;

let resourcesMap = new Map();

const log = (...args) =>
  fs.writeSync(
    1,
    `[executionAsyncId=${asyncHooks.executionAsyncId()}] ${util.format(
      ...args,
    )}\n`,
  );

const getRootAsyncId = (asyncId = asyncHooks.executionAsyncId()) => {
  if (!resourcesMap.has(asyncId)) {
    return asyncId;
  }
  return getRootAsyncId(resourcesMap.get(asyncId).parent);
};

const init = (asyncId, type, triggerAsyncId) => {
  resourcesMap.set(asyncId, {
    parent: triggerAsyncId,
    root: getRootAsyncId(triggerAsyncId),
  });
  log('init', { asyncId, type, triggerAsyncId, rootAsyncId: getRootAsyncId() });
};
const destroy = asyncId => log('destroy', { asyncId });

const install = () => {
  if (asyncHook) {
    return;
  }
  asyncHook = asyncHooks.createHook({ init, destroy });
  asyncHook.enable();
};

install();

log('outside everything (top level)');
setTimeout(() => {
  log('inside first setTimeout');
  setTimeout(() => {
    log('inside second setTimeout');
  }, 1);
}, 1);
process.nextTick(() => {
  log('inside first process.nextTick');
  process.nextTick(() => log('inside second process.nextTick'));
});
