const moment = require('moment');

const humanizeAge = ms => {
  const d = moment.duration(ms);
  const p = n => `${n}`.padStart(2, '0');
  return `${p(d.hours())}h${p(d.minutes())}m${p(d.seconds())}s`;
};

module.exports = humanizeAge;
