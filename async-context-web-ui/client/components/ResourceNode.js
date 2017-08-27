const React = require('react');
const PropTypes = require('prop-types');

const humanizeAge = require('../util/humanizeAge');

require('./ResourceNode.css');
const Tree = require('./Tree');

class ResourceNode extends React.PureComponent {
  constructor(...args) {
    super(...args);
    this.state = {
      expanded: true,
    };
    this.toggle = this.toggle.bind(this);
    this.selectResource = this.selectResource.bind(this);
    this.selectCoroutine = this.selectCoroutine.bind(this);
  }

  toggle() {
    this.setState(({ expanded }) => ({ expanded: !expanded }));
  }

  selectResource(e) {
    const { onSelectResource, children: resource } = this.props;
    if (typeof onSelectResource === 'function') {
      onSelectResource(e, resource);
    }
  }

  selectCoroutine(e) {
    const { onSelectCoroutine, children: resource } = this.props;
    const coroutine = resource.annotations.coroutine;
    if (coroutine && typeof onSelectCoroutine === 'function') {
      onSelectCoroutine(e, coroutine, resource);
    }
  }

  render() {
    const {
      children: resource,
      onSelectResource,
      onSelectCoroutine,
    } = this.props;
    const { expanded } = this.state;

    const childrenTree = expanded
      ? <Tree>
          {resource.children.map(resource =>
            <ResourceNode
              key={resource.resourceId}
              onSelectResource={onSelectResource}
              onSelectCoroutine={onSelectCoroutine}
            >
              {resource}
            </ResourceNode>,
          )}
        </Tree>
      : null;

    const baseResourceNode = (
      <Tree.Node
        className={'BaseResourceNode'}
        name={
          <span
            className={`BaseResourceNode__Name BaseResourceNode__Name__${resource.lifecycleStatus}`}
          >
            <span className="BaseResourceNode__Chevron" onClick={this.toggle}>
              {expanded ? '▾' : '▸'}
            </span>
            <span
              className="BaseResourceNode__ResourceName"
              onClick={this.selectResource}
            >
              {resource.type}#{resource.resourceId}
            </span>
            <span className="BaseResourceNode__Age">
              {humanizeAge(resource.ageInMs)}
            </span>
            <span className="BaseResourceNode__ExecutionAsyncId">
              {resource.executionAsyncId}
            </span>
          </span>
        }
      >
        {childrenTree}
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
          <span className="CoroutineNode__Name" onClick={this.selectCoroutine}>
            {coroutine.name}@{coroutine.id}
          </span>
        }
      >
        <Tree>
          {baseResourceNode}
        </Tree>
      </Tree.Node>
    );
  }
}

ResourceNode.propTypes = {
  children: PropTypes.object,
  onSelectResource: PropTypes.function,
  onSelectCoroutine: PropTypes.function,
};

module.exports = ResourceNode;
