const inspectable = require('./inspectable');

let currentCoroutine = null;

const runMicroTask = fn => Promise.resolve().then(fn);

let _nextCoroutineIdMemo = new WeakMap();
const getNextCoroutineId = monitor => {
  if (!_nextCoroutineIdMemo.has(monitor)) {
    _nextCoroutineIdMemo.set(monitor, 0);
  }
  const nextCoroutineId = _nextCoroutineIdMemo.get(monitor);
  _nextCoroutineIdMemo.set(monitor, nextCoroutineId + 1);
  return nextCoroutineId;
};

const Coroutine = inspectable(
  class Coroutine {
    static get context() {
      return currentCoroutine ? currentCoroutine.context : null;
    }

    static get props() {
      return currentCoroutine ? currentCoroutine.props : [];
    }

    static get monitor() {
      return currentCoroutine ? currentCoroutine.monitor : null;
    }

    static create(monitor, name, task, context) {
      return (...props) => new Coroutine(monitor, name, task, props, context);
    }

    static toJS() {
      return currentCoroutine.toJS();
    }

    constructor(monitor, name, task, props, context = Coroutine.context) {
      this.monitor = monitor;
      this.name = name;
      this.id = getNextCoroutineId(monitor);
      this.task = task.bind(null, props);
      this.props = props;
      this.context = context;

      this._parentNode = this.monitor.getCurrentNode();
      this._parentCoroutine = currentCoroutine;
      this._node = null;

      this._start = this._start.bind(this);
      this._onMonitorAddNode = this._onMonitorAddNode.bind(this);

      this._promise = runMicroTask(this._start);
    }

    toJS() {
      return {
        name: this.name,
        id: this.id,
        props: inspectable.toJS(this.props),
        context: inspectable.toJS(this.context),
      };
    }

    join() {
      return this._promise;
    }

    async _start() {
      this._node = this.monitor.getCurrentNode();
      this._node.annotations.set('coroutine', {
        name: this.name,
        id: this.id,
      });
      this.monitor.addListener('addNode', this._onMonitorAddNode);
      try {
        return await runMicroTask(this.task);
      } finally {
        this.monitor.removeListener('addNode', this._onMonitorAddNode);
      }
    }

    _onMonitorAddNode(node) {
      if (this.monitor.isAncestorNode(this._node, node)) {
        currentCoroutine = this;
      }
    }
  },
);

Coroutine.create = Coroutine.create.bind(Coroutine);

module.exports = Coroutine;
