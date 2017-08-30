const Zone = require('Zone');

class Node {
  constructor(type, name) {
    this.type = type;
    this.name = name;
  }
}

class ZoneNode extends Node {
  constructor(name, zone, parentFrameNode) {
    super('ZoneNode', name);
    this.zone = zone;
    this.parentFrameNode = parentFrameNode;
    this.childrenZoneFrameNodes = new Set();
  }
}

class TaskNode extends Node {
  constructor(name, task, parentFrameNode) {
    super('TaskNode', name);
    this.task = task;
    this.parentFrameNode = parentFrameNode;
    this.childrenTaskFrameNodes = new Set();
  }
}

class FrameNode extends Node {
  constructor(type, name) {
    super(type, name);
    this.childrenFrameNodes = new Set();
    this.childrenTaskNodes = new Set();
    this.childrenZoneNodes = new Set();
  }
}

class ZoneFrameNode extends FrameNode {
  constructor(name, parentZoneNode) {
    super('ZoneFrameNode', name);
    this.parentZoneNode = parentZoneNode;
  }
}

class TaskFrameNode extends FrameNode {
  constructor(name, parentTaskNode) {
    super('TaskFrameNode', parentTaskNode);
    this.parentTaskNode = parentTaskNode;
  }
}

const monitorZoneSpec = monitor => ({
  onFork(parentZoneDelegate, monitorZone, parentZone, originalZoneSpec) {
    const zoneSpec = Object.assign({}, monitor.zoneSpec, originalZoneSpec);
    return parentZoneDelegate.fork(zoneSpec);
  },
});

class Monitor {
  constructor() {
    this.zoneSpec = monitorZoneSpec(this);
  }

  fork(name, properties) {
    const zoneSpec = Object.assign({ name, properties }, this.zoneSpec);
    const childZone = Zone.current.fork(zoneSpec);
    return childZone;
  }
}

module.exports = Monitor;
