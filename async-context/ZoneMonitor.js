const Zone = require('Zone');
const now = require('performance-now');

let _currentFrame = null;
const setCurrentFrame = frame => (_currentFrame = frame);
const getCurrentFrame = () => _currentFrame;

const NodeType = {
  TaskNode: 'TaskNode',
  ZoneNode: 'ZoneNode',
};

class Node {
  static nextNodeId() {
    return Node._nextNodeId++;
  }
  constructor(parent) {
    this.parent = parent;
    this.children = new Set();
    this.nodeId = Node.nextNodeId();
    this.nodeType = this.constructor.nodeType;
  }
}
Node._nextNodeId = 0;

class TaskNode extends Node {
  constructor(task, parent) {
    super(parent);
    this.task = task;
  }
}

class MicroTaskNode extends TaskNode {}
MicroTaskNode.nodeType = 'MicroTaskNode';
class MacroTaskNode extends TaskNode {}
MacroTaskNode.nodeType = 'MacroTaskNode';
class EventTaskNode extends TaskNode {}
EventTaskNode.nodeType = 'EventTaskNode';

class ZoneNode extends Node {
  constructor(zone, parent) {
    super(parent);
    this.zone = zone;
  }
}
ZoneNode.nodeType = 'ZoneNode';

class Monitor {
  constructor() {
    this.rootNodes = new Set();
    ['_onFork', '_onIntercept', '_onInvoke', '_onHasTask'].forEach(
      key => (this[key] = this[key].bind(this)),
    );
  }

  fork(task) {}

  _onFork() {}
  _onIntercept() {}
  _onInvoke() {}
  _onHasTask() {}
}
