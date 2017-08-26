const React = require('react');
const { render } = require('react-dom');

const MonitorUIClient = require('./components/MonitorUIClient');

const appNode = document.createElement('div');
document.body.appendChild(appNode);
render(<MonitorUIClient />, appNode);
