const axios = require('axios');
const React = require('react');
const PropTypes = require('prop-types');
const { Component } = React;

const RootResources = require('./RootResources');

class Coroutines extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      err: null,
      res: null,
      isMounted: false,
    };
    this._scheduleNextFetch = this._scheduleNextFetch.bind(this);
    this._fetch = this._fetch.bind(this);
    this._fetchDidResolve = this._fetchDidResolve.bind(this);
    this._fetchDidReject = this._fetchDidReject.bind(this);
  }

  componentDidMount() {
    this.setState({ isMounted: true });
    this._scheduleNextFetch();
  }

  componentWillUnmount() {
    this.setState({ isMounted: false });
  }

  get isMounted() {
    return this.state.isMounted;
  }

  _scheduleNextFetch() {
    setTimeout(this._fetch, this.props.delay);
  }

  _fetch() {
    if (!this.isMounted) {
      return;
    }
    axios
      .get('/coroutines')
      .then(this._fetchDidResolve)
      .catch(this._fetchDidReject);
  }

  _fetchDidResolve(res) {
    if (!this.isMounted) {
      return;
    }
    this.setState({ err: null, res: res.data });
    this._scheduleNextFetch();
  }

  _fetchDidReject(err) {
    if (!this.isMounted) {
      return;
    }
    this.setState({ err, res: null });
    this._scheduleNextFetch();
  }

  render() {
    const { err, res } = this.state;
    if (err) {
      return (
        <pre>
          {err.toString()}
        </pre>
      );
    }
    if (res) {
      return <RootResources rootResources={res.rootResources} />;
    }
    return (
      <div>
        {'...'}
      </div>
    );
  }
}

Coroutines.propTypes = {
  delay: PropTypes.number,
};

Coroutines.defaultProps = {
  delay: 1000,
};

module.exports = Coroutines;
