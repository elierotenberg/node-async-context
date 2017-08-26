const asyncHooks = require('async_hooks');
const fs = require('fs');
const util = require('util');

const EventEmitter = require('./EventEmitter');
const inspectable = require('./inspectable');
const { getLocation } = require('./trace');

const LIFECYCLE = {
  STARTED: 'STARTED',
  DESTROYED: 'DESTROYED',
};

const Node = inspectable(
  class Node {
    constructor(resourceId, parentResourceId, type, location) {
      this.resourceId = resourceId;
      this.parentResourceId = parentResourceId;
      this.type = type;
      this.location = location;
      this.annotations = new Map();
      this.children = new Set();

      this._lifecycleStatus = this.constructor.LIFECYCLE.STARTED;
    }

    get lifecycleStatus() {
      return this._lifecycleStatus;
    }

    toJS() {
      return {
        resourceId: this.resourceId,
        parentResourceId: this.parentResourceId,
        type: this.type,
        lifecycleStatus: this._lifecycleStatus,
        annotations: Array.from(
          this.annotations,
        ).reduce((obj, [key, value]) => {
          obj[key] = inspectable.toJS(value);
          return obj;
        }, {}),
        children: Array.from(this.children, inspectable.toJS),
      };
    }

    isLeaf() {
      return this.children.size === 0;
    }

    isDestroyed() {
      return this._lifecycleStatus === this.constructor.LIFECYCLE.DESTROYED;
    }

    destroy() {
      this._lifecycleStatus = this.constructor.LIFECYCLE.DESTROYED;
      return this;
    }
  },
);

Node.LIFECYCLE = LIFECYCLE;

const defaultOpts = {
  maxListeners: Infinity,
  recordStackTraces: false,
};

const Monitor = inspectable(
  class Monitor extends EventEmitter {
    static log(obj, opts = { depth: null }) {
      return fs.writeFileSync(
        1,
        `${typeof obj === 'string' ? obj : util.inspect(obj, opts)}\n`,
      );
    }

    constructor(_opts = {}) {
      super();
      this.opts = Object.assign({}, defaultOpts, _opts);
      this.setMaxListeners(this.opts.maxListeners);
      // node.resourceId -> node
      this._nodes = new Map();
      // All nodes in _rootNodes are also in _nodes
      // node.resourceId -> void
      this._rootNodes = new Set();
      this._asyncHook = asyncHooks.createHook({
        init: this._onInitHook.bind(this),
        destroy: this._onDestroyHook.bind(this),
      });
      this._asyncHook.enable();
    }

    toJS() {
      return {
        rootNodes: Array.from(this._rootNodes, inspectable.toJS),
        listeners: super.toJS().listeners,
      };
    }

    getRootNodes() {
      return this._rootNodes.values();
    }

    getCurrentNode() {
      return this._nodes.get(asyncHooks.executionAsyncId());
    }

    getParentNode(node) {
      return this._nodes.get(node.parentResourceId);
    }

    isAncestorNode(ancestorNode, descendantNode) {
      if (!ancestorNode) {
        return false;
      }
      if (descendantNode === ancestorNode) {
        return true;
      }
      if (this._isRootNode(descendantNode)) {
        return false;
      }
      const parentNode = this.getParentNode(descendantNode);
      return this.isAncestorNode(ancestorNode, parentNode);
    }

    _isRootNode(node) {
      return this._rootNodes.has(node);
    }

    _hasNode(node) {
      return this._nodes.has(node.resourceId);
    }

    _addNode(node) {
      this._nodes.set(node.resourceId, node);
      const parentNode = this._nodes.get(node.parentResourceId);
      if (parentNode) {
        parentNode.children.add(node);
      } else {
        this._rootNodes.add(node);
      }
      this.emit('addNode', node);
      return this;
    }

    _removeNode(node) {
      node.destroy();
      this._collectGarbage(node);
      this.emit('removeNode', node);
    }

    _collectGarbage(node) {
      // A node can only be garbage collected after all of its children have destroyed
      if (node.isDestroyed() && node.isLeaf()) {
        this.emit('collectGarbage', node);
        const parentNode = this.getParentNode(node);
        if (parentNode) {
          parentNode.children.delete(node);
          this._collectGarbage(parentNode);
        }
        this._nodes.delete(node.resourceId);
        if (this._rootNodes.has(node)) {
          this._rootNodes.delete(node);
        }
      }
    }

    _onInitHook(resourceId, type, parentResourceId) {
      this.emit('init', resourceId, type, parentResourceId);
      this._addNode(
        new Node(
          resourceId,
          parentResourceId,
          type,
          this.opts.recordStackTraces ? getLocation() : null,
        ),
      );
    }

    _onDestroyHook(resourceId) {
      this.emit('destroy', resourceId);
      const node = this._nodes.get(resourceId);
      if (!node) {
        return;
      }
      this._removeNode(node);
    }
  },
);

Monitor.log = Monitor.log.bind(Monitor);

module.exports = Monitor;
