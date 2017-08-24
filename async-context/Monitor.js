const asyncHooks = require('async_hooks');
const fs = require('fs');
const util = require('util');

const EventEmitter = require('./EventEmitter');
const inspectable = require('./inspectable');

const LIFECYCLE = {
  STARTED: 'STARTED',
  DESTROYED: 'DESTROYED',
};

const Node = inspectable(
  class Node extends EventEmitter {
    constructor(resourceId, parentResourceId, type) {
      super();
      this.resourceId = resourceId;
      this.parentResourceId = parentResourceId;
      this.type = type;
      this._lifecycleStatus = this.constructor.LIFECYCLE.STARTED;
      this._children = new Set();
    }

    toJS() {
      return {
        resourceId: this.resourceId,
        parentResourceId: this.parentResourceId,
        type: this.type,
        lifecycleStatus: this._lifecycleStatus,
        children: Array.from(this._children, inspectable.toJS),
        listeners: super.toJS().listeners,
      };
    }

    isLeaf() {
      return this._children.size === 0;
    }

    isDestroyed() {
      return this._lifecycleStatus === this.constructor.LIFECYCLE.DESTROYED;
    }

    destroy() {
      this._lifecycleStatus = this.constructor.LIFECYCLE.DESTROYED;
      return this;
    }

    addChild(node) {
      this._children.add(node);
      return this;
    }

    removeChild(node) {
      this._children.delete(node);
      return this;
    }
  },
);

Node.LIFECYCLE = LIFECYCLE;

const Monitor = inspectable(
  class Monitor extends EventEmitter {
    static log(obj, opts = { depth: null }) {
      return fs.writeFileSync(
        1,
        `${typeof obj === 'string' ? obj : util.inspect(obj, opts)}\n`,
      );
    }

    constructor() {
      super();
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
        parentNode.addChild(node);
      } else {
        this._rootNodes.add(node);
      }
      this.emit('addNode', node);
      return this;
    }

    _removeNode(node) {
      const parentNode = this._nodes.get(node.parentResourceId);
      if (parentNode) {
        parentNode.removeChild(node);
        if (parentNode.isDestroyed()) {
          this._collectGarbage(parentNode);
        }
      }
      node.destroy();
      this._collectGarbage(node);
      this.emit('removeNode', node, parentNode);
    }

    _collectGarbage(node) {
      // A node can only be garbage collected after all of its children have destroyed
      if (node.isLeaf()) {
        this.emit('collectGarbage', node);
        this._nodes.delete(node.resourceId);
        this._rootNodes.delete(node);
      }
    }

    _onInitHook(resourceId, type, parentResourceId) {
      this.emit('init', resourceId, type, parentResourceId);
      this._addNode(new Node(resourceId, parentResourceId, type));
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
