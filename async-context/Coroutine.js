const EventEmitter = require('./EventEmitter');
const inspectable = require('./inspectable');

let currentCoroutine = null;

const runMicroTask = fn => Promise.resolve().then(fn);

const Coroutine = inspectable(
  class Coroutine extends EventEmitter {
    static get context() {
      return currentCoroutine.context;
    }

    static spawn(...args) {
      return new this(...args).join();
    }

    static toJS() {
      return currentCoroutine.toJS();
    }

    constructor(
      fn,
      context = currentCoroutine.context,
      monitor = currentCoroutine.monitor,
    ) {
      super();
      this._fn = fn;
      this.monitor = monitor;
      this.context = context;

      this._parentNode = this.monitor.getCurrentNode();
      this._parentCoroutine = currentCoroutine;
      this._node = null;
      this._nodes = new Set();

      this._onMonitorAddNode = this._onMonitorAddNode.bind(this);
      this._onMonitorRemoveNode = this._onMonitorRemoveNode.bind(this);
      this._start = this._start.bind(this);

      this._promise = runMicroTask(this._start);
    }

    toJS() {
      return {
        listeners: super.toJS().listeners,
        nodes: Array.from(this._nodes, inspectable.toJS),
        context: inspectable.toJS(this.context),
      };
    }

    join() {
      return this._promise;
    }

    emit(...args) {
      super.emit('*', ...args);
      super.emit(...args);
      return this;
    }

    async _start() {
      this._node = this.monitor.getCurrentNode();
      this.monitor.addListener('addNode', this._onMonitorAddNode);
      this.monitor.addListener('removeNode', this._onMonitorRemoveNode);
      try {
        return await runMicroTask(this._fn);
      } finally {
        this.monitor.removeListener('removeListener', this._onMonitorAddNode);
        this.monitor.removeListener(
          'removeListener',
          this._onMonitorRemoveNode,
        );
      }
    }

    _onMonitorAddNode(node) {
      if (this.monitor.isAncestorNode(this._node, node)) {
        this._nodes.add(node);
        currentCoroutine = this;
      }
    }

    _onMonitorRemoveNode(node) {
      this._nodes.delete(node);
    }
  },
);

Coroutine.spawn = Coroutine.spawn.bind(Coroutine);

module.exports = Coroutine;
