const React = require('react');
const PropTypes = require('prop-types');

const PreJSON = ({ children }) =>
  <pre>
    {JSON.stringify(children, null, 2)}
  </pre>;

PreJSON.propTypes = {
  children: PropTypes.object,
};

module.exports = PreJSON;
