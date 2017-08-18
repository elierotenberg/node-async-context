const express = require('express');
const {
  spawn,
  setState,
  getState,
  getDefaultMonitor,
} = require('../async-context');
const ContextMonitorUI = require('../async-context-ui');

const readTimeFromRemoteServer = () =>
  new Promise(
    resolve => setTimeout(() => resolve(Date.now()), 1000), // emulate lag
  );

const handleRequest = async () => {
  const { req, res } = getState();
  await readTimeFromRemoteServer();
  res.send({
    ip: req.ip,
    now: Date.now(),
  });
};

spawn('app', async () => {
  const app = express().get('/', (req, res) =>
    spawn('worker', async () => {
      setState({ req, res });
      await handleRequest();
    }).catch(() => res.status(500)),
  );

  app.listen(8080);
});

// const ui = new ContextMonitorUI(getDefaultMonitor(), 1000);
// ui.start();
