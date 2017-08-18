const express = require('express');
const {
  spawn,
  findContext,
  setState,
  getState,
  prettyPrint,
} = require('../lib');

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
      return findContext();
    })
      .catch(() => res.status(500))
      .then(() => prettyPrint()),
  );

  app.listen(8080);
});
