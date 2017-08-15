import asyncHooks from 'async_hooks';
import shortid from 'shortid';

class ContextError extends Error {
  constructor(context, text) {
    const message = `ContextError (context.name = ${context.name}) ${text}`;
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
    this.context = context;
  }
}

class Context {
  constructor(name, contextId, parentContextId = null) {
    this.name = name;
    this.contextId = contextId;
    this.parentContextId = parentContextId;
    this.state = Object.create(null);

    this.childrenContexts = new Set();
    this.childrenResources = new Set();
    this._promise = null;
  }

  generateChildContextName() {
    return `${this.name}.${shortid.generate()}`;
  }

  _addChildContext(context) {
    this.childrenContexts.add(context.contextId);
  }

  _removeChildContext(context) {
    this.childrenContexts.delete(context.contextId);
  }

  _addChildResource(resource) {
    this.childrenResources.add(resource.resourceId);
  }

  _removeChildResource(resource) {
    this.childrenResources.delete(resource.resourceId);
  }

  _throw(text) {
    throw new ContextError(this, text);
  }

  _run(asyncFn) {
    if (this.promise !== null) {
      this._throw('Context#run can only be called once');
    }
    this.promise = asyncFn().catch(err => this._throw(err.message));
    return this.promise;
  }

  join() {
    return this._promise;
  }

  get isLeaking() {
    return this.childrenResources.size > 0;
  }
}

class Resource {
  constructor(resourceId, type, parentResourceId, contextId) {
    this.resourceId = resourceId;
    this.type = type;
    this.parentResourceId = parentResourceId;
    this.contextId = contextId;

    this.childrenResources = new Set();
  }

  _addChildResource(resource) {
    this.childrenResources.add(resource.resourceId);
  }

  _removeChildResource(resource) {
    this.childrenResources.delete(resource.resourceId);
  }

  get isLeaking() {
    return this.childrenResources.size > 0;
  }
}

class Monitor {
  static defaultMonitor = null;

  static getDefaultMonitor() {
    if (this.defaultMonitor === null) {
      this.defaultMonitor = new this();
    }
    return this.defaultMonitor;
  }

  static generateContextName() {
    return shortid.generate();
  }

  static getCurrentResourceId() {
    return asyncHooks.executionAsyncId();
  }

  constructor() {
    this.trackedContexts = new Map();
    this.trackedResources = new Map();

    this.asyncHook = asyncHooks.createHook({
      init: this._onInitHook.bind(this),
      destroy: this._onDestroyHook.bind(this),
    });

    this.asyncHook.enable();
  }

  nextMicroTask() {
    return Promise.resolve();
  }

  findContext(resourceId = this.constructor.getCurrentResourceId()) {
    if (this.hasContext(resourceId)) {
      return this.getContext(resourceId);
    }
    if (this.hasResource(resourceId)) {
      return this.getContext(this.getResource(resourceId).contextId);
    }
    return null;
  }

  async fork(...args) {
    const parentContext = this.findContext();
    let name = null;
    let asyncFn = null;
    if (args.length === 2) {
      name = args[0];
      asyncFn = args[1];
    } else {
      name = void 0;
      asyncFn = args[0];
    }
    if (!name) {
      name = parentContext
        ? parentContext.generateChildContextName()
        : this.constructor.generateContextName();
    }

    await this.nextMicroTask();
    const contextId = this.constructor.getCurrentResourceId();
    const parentContextId = parentContext ? parentContext.contextId : null;
    const context = new Context(name, contextId, parentContextId);
    if (parentContext) {
      parentContext._addChildContext(context);
    }
    this._trackContext(context);
    return await context._run(asyncFn);
  }

  hasContext(contextId) {
    return this.trackedContexts.has(contextId);
  }

  getContext(contextId) {
    return this.trackedContexts.get(contextId);
  }

  _trackContext(context) {
    this.trackedContexts.set(context.contextId, context);
  }

  _untrackContext(context) {
    this.trackedContexts.delete(context.contextId);
  }

  hasResource(resourceId) {
    return this.trackedResources.has(resourceId);
  }

  getResource(resourceId) {
    return this.trackedResources.get(resourceId);
  }

  _trackResource(resource) {
    this.trackedResources.set(resource.resourceId, resource);
  }

  _untrackResource(resource) {
    this.trackedResource.delete(resource.resourceId);
  }

  _onInitHook(resourceId, type, parentResourceId) {
    if (this.hasContext(resourceId)) {
      const context = this.getContext(resourceId);
      const resource = new Resource(
        resourceId,
        type,
        parentResourceId,
        context.contextId,
      );
      context._addChildResource(resource);
      this._trackResource(resource);
      return;
    }
    if (this.hasResource(parentResourceId)) {
      const parentResource = this.getResource(parentResourceId);
      const context = this.getContext(parentResource.contextId);
      const resource = new Resource(
        resourceId,
        type,
        parentResourceId,
        context.contextId,
      );
      context._addChildResource(resource);
      parentResource._addChildResource(resource);
      this._trackResource(resource);
      return;
    }
  }

  _onDestroyHook(resourceId) {
    if (this.hasContext(resourceId)) {
      const context = this.getContext(resourceId);
      const parentContextId = context.parentContextId;
      if (this.hasContext(parentContextId)) {
        const parentContext = this.getContext(parentContextId);
        parentContext._removeChildContext(context);
      }
      this._untrackContext(context);
      return;
    }
    if (this.hasResource(resourceId)) {
      const resource = this.getResource(resourceId);
      if (this.hasResource(resource.parentResourceId)) {
        const parentResource = this.getResource(resource.parentResourceId);
        parentResource._removeChildResource(resource);
      }
      if (this.hasContext(resource.contextId)) {
        const context = this.getContext(resource.contextId);
        context._removeChildResource(resource);
      }
      this._untrackResource(resource);
    }
  }
}

const fork = (...args) => Monitor.getDefaultMonitor().fork(...args);

export { fork };
export default Monitor;
