const fs = require('fs');
const path = require('path');
const url = require('url');

const inspectCoroutines = require('./inspectCoroutines');

const clientHtml = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'client.dist.html'),
  'utf8',
);

const serveClientHtml = res => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
  res.end(clientHtml);
};

const serveJSON = (res, obj) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(obj));
};

const serveNotFound = res => {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('Not found');
};

class MonitorUIServer {
  constructor(monitor) {
    this.monitor = monitor;
    this.serve = this.serve.bind(this);
  }

  serve(req, res) {
    const { pathname } = url.parse(req.url);
    if (pathname === '/') {
      serveClientHtml(res);
      return;
    }
    if (pathname === '/coroutines') {
      serveJSON(res, inspectCoroutines(this.monitor));
      return;
    }
    serveNotFound(res);
  }
}

module.exports = MonitorUIServer;
