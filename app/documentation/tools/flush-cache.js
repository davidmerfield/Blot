const config = require("config");
const host = config.host;
const reverse_proxies = config.reverse_proxies;
const flushCache = require("helper/flushCache");
const flush = flushCache({ reverse_proxies });

module.exports = () => {
  flush(host)
    .then(() => {})
    .catch((error) => {
      console.error("Error flushing cache directories:", error);
    });
};
