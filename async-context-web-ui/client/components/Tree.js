const React = require('react');
const PropTypes = require('prop-types');
require('./Tree.css');

const mergeClassNames = (...args) => args.filter(c => c).join(' ');

const Tree = ({ children, className, ...props }) =>
  <ol {...props} className={mergeClassNames('Tree', className)}>
    {children}
  </ol>;
Tree.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const Node = ({ name, children, inline, className, ...props }) =>
  <li
    {...props}
    className={mergeClassNames(
      'Tree__Node',
      inline && 'Tree__Node__inline',
      className,
    )}
  >
    <div className={'Tree__Node__Name'}>
      {name}
    </div>
    {children}
  </li>;

Node.propTypes = {
  name: PropTypes.node,
  children: PropTypes.node,
  inline: PropTypes.bool,
  className: PropTypes.string,
};

Tree.Node = Node;

module.exports = Tree;
