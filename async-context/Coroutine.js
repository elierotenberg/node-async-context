const EventEmitter = require('./EventEmitter');
const inspectable = require('./inspectable');

let currentCoroutine = null;

const runMicroTask = fn => Promise.resolve().then(fn);

const Coroutine = inspectable(
  class Coroutine extends EventEmitter {
    static get context() {
      return currentCoroutine ? currentCoroutine.context : null;
    }

    static get props() {
      return currentCoroutine ? currentCoroutine.props : [];
    }

    static get monitor() {
      return currentCoroutine ? currentCoroutine.monitor : null;
    }

    static create(monitor, task, context) {
      return (...props) => new Coroutine(monitor, task, props, context);
    }

    static toJS() {
      return currentCoroutine.toJS();
    }

    constructor(monitor, task, props, context = Coroutine.context) {
      super();
      this.monitor = monitor;
      this.task = task.bind(null, props);
      this.props = props;
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
        props: inspectable.toJS(this.props),
        context: inspectable.toJS(this.context),
      };
    }

    join() {
      return this._promise;
    }

    getNodes() {
      return this._nodes;
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
        return await runMicroTask(this.task);
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
        this.monitor.constructor.log(`(++) ${this._nodes.size}`);
      }
    }

    _onMonitorRemoveNode(node) {
      if (this._nodes.has(node)) {
        this._nodes.delete(node);
        this.monitor.constructor.log(`(--) ${this._nodes.size}`);
      }
    }
  },
);

Coroutine.create = Coroutine.create.bind(Coroutine);

module.exports = Coroutine;
