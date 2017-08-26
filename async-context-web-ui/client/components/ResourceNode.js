const React = require('react');
const PropTypes = require('prop-types');

require('./ResourceNode.css');
const Tree = require('./Tree');

const ResourceNode = ({ children: resource }) => {
  const coroutine = resource.annotations.coroutine;
  const coroutineName = coroutine
    ? <span className="ResourceNode__CoroutineName">
        {coroutine.name}#{coroutine.id}
      </span>
    : null;

  const resourceName = (
    <span className="ResourceNode__ResourceName">
      {resource.type}#{resource.resourceId}
    </span>
  );

  const age = (
    <span className="ResourceNode__Age">
      {resource.ageInMs}
    </span>
  );

  const executionAsyncId = (
    <span className="ResourceNode__ExecutionAsyncId">
      {resource.executionAsyncId}
    </span>
  );

  return (
    <Tree.Node
      name={
        <span
          className={`ResourceNode__Name ResourceNode__Name__${resource.lifecycleStatus}`}
        >
          {coroutineName}
          {resourceName}
          {age}
          {executionAsyncId}
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
};

ResourceNode.propTypes = {
  children: PropTypes.object,
};

module.exports = ResourceNode;
