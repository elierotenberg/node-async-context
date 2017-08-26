const React = require('react');
const PropTypes = require('prop-types');
const moment = require('moment');

require('./ResourceNode.css');
const Tree = require('./Tree');

const humanize = ms => {
  const d = moment.duration(ms);
  const p = n => `${n}`.padStart(2, '0');
  return `${p(d.hours())}h${p(d.minutes())}m${p(d.seconds())}s`;
};

const ResourceNode = ({ children: resource }) => {
  const baseResourceNode = (
    <Tree.Node
      className={'BaseResourceNode'}
      name={
        <span
          className={`BaseResourceNode__Name BaseResourceNode__Name__${resource.lifecycleStatus}`}
        >
          <span className="BaseResourceNode__ResourceName">
            {resource.type}#{resource.resourceId}
          </span>
          <span className="BaseResourceNode__Age">
            {humanize(resource.ageInMs)}
          </span>
          <span className="BaseResourceNode__ExecutionAsyncId">
            {resource.executionAsyncId}
          </span>
        </span>
      }
    >
      <Tree>
        {resource.children.map(resource =>
          <ResourceNode key={resource.resourceId}>
            {resource}
          </ResourceNode>,
        )}
      </Tree>
    </Tree.Node>
  );

  const coroutine = resource.annotations.coroutine;

  if (!coroutine) {
    return baseResourceNode;
  }

  return (
    <Tree.Node
      className={'CoroutineNode'}
      name={
        <span className="CoroutineNode__Name">
          {coroutine.name}@{coroutine.id}
        </span>
      }
    >
      <Tree>
        {baseResourceNode}
      </Tree>
    </Tree.Node>
  );
};

ResourceNode.propTypes = {
  children: PropTypes.object,
};

module.exports = ResourceNode;
