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

const monitor = new Monitor({ recordStackTraces: true });
const monitorUIServer = new MonitorUIServer(monitor);

const spawnRequestHandler = Coroutine.create(
  monitor,
  'requestHandler',
  async userId => {
    const [description, nickName] = await Promise.all([
      fetchUserDescription(userId),
      fetchUserNickname(userId),
    ]);
    return { description, nickName };
  },
);

const spawnServer = Coroutine.create(monitor, 'server', async () => {
  http
    .createServer(async (req, res) => {
      const userId = url.parse(req.url, true).query.userId;
      const proc = spawnRequestHandler(userId);
      const info = await proc.join();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify(info));
    })
    .listen(8080);

  http.createServer(monitorUIServer.serve).listen(8081);
});

spawnServer();
