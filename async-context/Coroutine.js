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

    static get monitor() {
      return currentCoroutine ? currentCoroutine.monitor : null;
    }

    static spawn(monitor) {
      return function spawn(name, task, context = null) {
        const coroutine = new Coroutine();
        return coroutine.run(monitor, name, task, context);
      };
    }

    static toJS() {
      return currentCoroutine.toJS();
    }

    constructor() {
      this.monitor = null;
      this.name = null;
      this.id = null;
      this.context = null;
      this._parentNode = null;
      this._parentCoroutine = null;
      this._node = null;
      this._start = this._start.bind(this);
      this._addNodeListener = this._addNodeListener.bind(this);
      this._removeNodeListener = this._removeNodeListener.bind(this);
      this._onMonitorAddNode = this._onMonitorAddNode.bind(this);
    }

    toJS() {
      return {
        name: this.name,
        id: this.id,
        context: inspectable.toJS(this.context),
      };
    }

    run(monitor, name, task, context) {
      this.monitor = monitor;
      this.name = name;
      this.id = getNextCoroutineId(monitor);
      this.context = context;

      this._parentNode = this.monitor.getCurrentNode();
      this._parentCoroutine = currentCoroutine;
      this._node = null;
      return runMicroTask(this._start(task));
    }

    _start(task) {
      return () => {
        this._node = this.monitor.getCurrentNode();
        this._node.annotations.set('coroutine', {
          name: this.name,
          id: this.id,
        });
        this._addNodeListener();
        return task().then(
          this._removeNodeListener(false),
          this._removeNodeListener(true),
        );
      };
    }

    _addNodeListener() {
      this.monitor.addListener('addNode', this._onMonitorAddNode);
    }

    _removeNodeListener(shouldReject) {
      return arg => {
        this.monitor.removeListener('addNode', this._onMonitorAddNode);
        if (shouldReject) {
          throw arg;
        }
        return arg;
      };
    }

    _onMonitorAddNode(node) {
      if (this.monitor.isAncestorNode(this._node, node)) {
        currentCoroutine = this;
      }
    }
  },
);

module.exports = Coroutine;
