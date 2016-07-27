var config = require('config');

module.exports = {
  protocol: config.protocol,
  host: config.host,
  title: config.title,
  cacheID: (new Date()).getTime()
};