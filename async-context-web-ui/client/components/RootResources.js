const React = require('react');
const PropTypes = require('prop-types');

const Tree = require('./Tree');
const ResourceNode = require('./ResourceNode');

const RootResources = ({
  rootResources,
  onSelectResource,
  onSelectCoroutine,
}) =>
  <Tree>
    {rootResources.map(resource =>
      <ResourceNode
        key={resource.resourceId}
        onSelectResource={onSelectResource}
        onSelectCoroutine={onSelectCoroutine}
      >
        {resource}
      </ResourceNode>,
    )}
  </Tree>;

RootResources.propTypes = {
  rootResources: PropTypes.array.isRequired,
  onSelectResource: PropTypes.function,
  onSelectCoroutine: PropTypes.function,
};

module.exports = RootResources;
