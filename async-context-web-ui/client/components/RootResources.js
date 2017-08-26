const React = require('react');
const PropTypes = require('prop-types');

const Tree = require('./Tree');
const ResourceNode = require('./ResourceNode');

const RootResources = ({ rootResources }) =>
  <Tree>
    {rootResources.map(resource =>
      <ResourceNode key={resource.resourceId}>
        {resource}
      </ResourceNode>,
    )}
  </Tree>;

RootResources.propTypes = {
  rootResources: PropTypes.array.isRequired,
};

module.exports = RootResources;
