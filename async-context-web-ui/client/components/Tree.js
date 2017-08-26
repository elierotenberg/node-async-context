const React = require('react');
const PropTypes = require('prop-types');
require('./Tree.css');

const Tree = ({ children, ...props }) =>
  <ol className="Tree" {...props}>
    {children}
  </ol>;
Tree.propTypes = {
  children: PropTypes.node,
};

class Node extends React.PureComponent {
  constructor(props, ...args) {
    super(props, ...args);
    this.state = {
      collapsed: false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(({ collapsed }) => ({ collapsed: !collapsed }));
  }

  render() {
    const { name, children, inline, ...props } = this.props;
    const { collapsed } = this.state;
    return (
      <li
        className={`Tree__Node${inline ? ' Tree__Node__inline' : ''}`}
        {...props}
      >
        <div className={'Tree__Node__Name'} onClick={this.toggle}>
          {name}
        </div>
        {collapsed ? null : children}
      </li>
    );
  }
}

Node.propTypes = {
  name: PropTypes.node,
  children: PropTypes.node,
  inline: PropTypes.bool,
};

Tree.Node = Node;

module.exports = Tree;
