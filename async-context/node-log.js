const util = require('util');
const fs = require('fs');

const log = (...args) => fs.writeFileSync(1, `${util.inspect(...args)}\n`);

module.exports = log;
