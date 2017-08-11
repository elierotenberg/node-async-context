import asyncHooks from 'async_hooks';
import fs from 'fs';
import util from 'util';

const membranes = new Map();
const resources = new Map();

// We use process.nextTick as a scheduler, but maybe new Promise or other microtask scheduler can be used elsewhere
const scheduleMicroTask = fn => process.nextTick(fn);

const debugLog = (...args) =>
  fs.writeSync(
    1,
    `[executionAsyncId=${asyncHooks.executionAsyncId()}] ${util.format(
      ...args,
    )}\n`,
  );

class Resource {
  constructor(resourceId, type, parentResourceId, membraneId) {
    this.resourceId = resourceId;
    this.type = type;
    this.parentResourceId = parentResourceId;
    this.membraneId = membraneId;
  }
}

class Membrane {
  constructor(membraneId, name) {
    this.membraneId = membraneId;
    this.name = name;
  }
}

const findMembraneId = parentResourceId => {
  const membrane = membranes.find(parentResourceId);
  if (membrane) {
    return membrane.membraneId;
  }
  const parentResource = resources.find(parentResourceId);
  if (!parentResource) {
    return null;
  }
  return parentResource.membraneId;
};

const init = (resourceId, type, parentResourceId) => {
  const membraneId = findMembraneId(parentResourceId);
  if (membraneId !== null) {
    const resource = new Resource(
      resourceId,
      type,
      parentResourceId,
      membraneId,
    );
    resources.set(resourceId, resource);
  }
};

const destroy = resourceId => {
  if (resources.has(resourceId)) {
    resources.delete(resourceId);
  }
  if (membranes.has(resourceId)) {
    membranes.delete(resourceId);
  }
};

const fork = (name, fn) => {
  const parentResourceId = asyncHooks.executionAsyncId();
  scheduleMicroTask(() => {
    const membraneId = asyncHooks.executionAsyncId();
    membranes.set(membraneId, new Membrane(membraneId, name, parentResourceId));
    fn();
  });
};

const asyncHook = asyncHooks.createHook({ init, destroy });

asyncHook.enable();

export { fork, debugLog };
