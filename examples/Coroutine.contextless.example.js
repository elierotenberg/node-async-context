const http = require('http');
const url = require('url');

const Coroutine = require('../async-context/Coroutine');
const Monitor = require('../async-context/Monitor');
const MonitorUIServer = require('../async-context-web-ui/server/MonitorUIServer');

process.on('unhandledRejection', err => {
  throw err;
});

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

const fetchUserDescription = async userId => {
  await sleep(100);
  return `/${userId}/userDescription`;
};

const fetchUserNickname = async userId => {
  await sleep(300);
  return `/${userId}/userNickname`;
};

const requestHandler = userId => async () => {
  const [description, nickName] = await Promise.all([
    fetchUserDescription(userId),
    fetchUserNickname(userId),
  ]);
  return { description, nickName };
};

// This monitor will maintain a lightweight representation of the ongoing async call tree
const monitor = new Monitor({
  recordTypes: true, // Record call types
  recordTimings: true, // Record call ages
  recordLocations: true, // Record call location stack (for debugging)
});

// This server will expose this representation as a real-time web UI
const monitorUIServer = new MonitorUIServer(monitor);
http.createServer(monitorUIServer.serve).listen(8081);

// We create a spawn operator to instrument the call tree monitor
const spawn = Coroutine.spawn(monitor);

// This marks this call as a named coroutine
spawn('server', async () => {
  http
    .createServer(async (req, res) => {
      const userId = url.parse(req.url, true).query.userId;
      // On each incoming request, mark the call as a separate child coroutine and awaits its completion
      const info = await spawn('requestHandler', requestHandler(userId));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(info));
      // Everything is automatically garbage-collected unless requestHandler code is leaking (resources or errors)
    })
    .listen(8080);
});
