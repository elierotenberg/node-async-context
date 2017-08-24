const url = require('url');
const http = require('http');

const Coroutine = require('./Coroutine');
const Monitor = require('./Monitor');

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

const fetchUserInfo = async userId => {
  const [description, nickName] = await Promise.all([
    fetchUserDescription(userId),
    fetchUserNickname(userId),
  ]);
  return { description, nickName };
};

const monitor = new Monitor();
const spawn = Coroutine.create(monitor, fetchUserInfo);

http
  .createServer(async (req, res) => {
    const userId = url.parse(req.url, true).query.userId;
    const proc = spawn(userId);
    const info = await proc.join();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info));
    const logNodes = () => Monitor.log(proc.getNodes().size);
    logNodes();
    setInterval(logNodes, 1000);
  })
  .listen(8080, '127.0.0.1');
