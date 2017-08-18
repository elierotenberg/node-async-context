const blessed = require('blessed');
const blessedContrib = require('blessed-contrib');

const mapObject = (obj, fn) => {
  const res = {};
  Object.keys(obj).forEach(k => (res[k] = fn(obj[k], k)));
  return res;
};

const mapArrayToObject = (arr, fn) => {
  const res = {};
  arr.forEach(originalVal => {
    const [k, v] = fn(originalVal);
    res[k] = v;
  });
};

const toTreeDataResource = ({
  resourceId,
  type,
  contextId,
  parentResourceId,
  childrenResources,
}) => [
  resourceId,
  {
    name: `Resource (type = ${type}, resourceId = ${resourceId}, parentResourceId = ${parentResourceId}, contextId = ${contextId})`,
    children: mapArrayToObject(childrenResources, toTreeDataResource),
  },
];

const toTreeData = ({ trackedContexts }) => ({
  extended: true,
  children: mapObject(
    trackedContexts,
    ({ name, contextId, parentContextId, childrenResources }) => ({
      name: `Context (name = ${name}, contextId = ${contextId}, parentContextId = ${parentContextId})`,
      children: mapArrayToObject(childrenResources, toTreeDataResource),
    }),
  ),
});

class ContextMonitorUI {
  constructor(monitor, period) {
    this.monitor = monitor;
    this.period = period;
    this.interval = null;
    this.screen = null;
    this.grid = null;
    this.tree = null;

    this.render = this.render.bind(this);
  }

  start() {
    if (this.interval !== null) {
      throw new Error('Already started');
    }

    this.screen = blessed.screen();

    this.tree = blessedContrib.tree();
    this.screen.append(this.tree);
    this.screen.key(['C-c'], () => process.exit(0));
    this.tree.focus();

    this.interval = setInterval(this.render, this.period);
  }

  stop() {
    clearInterval(this.interval);
    this.screen.destroy();
  }

  render() {
    this.tree.setData(toTreeData(this.monitor.toJS()));
    this.screen.render();
  }
}

module.exports = ContextMonitorUI;
