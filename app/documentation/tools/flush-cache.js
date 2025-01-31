const config = require("config");

const reverse_proxy_urls = config.reverse_proxies;

const flush = () => {
  reverse_proxy_urls.forEach(reverse_proxy_url => {
    fetch(reverse_proxy_url + "/purge?host=" + config.host)
      .then(res => {
        console.log("proxy: " + reverse_proxy_url + " flushed:" + config.host);
      })
      .catch(e => {
        console.log("proxy: " + reverse_proxy_url + " failed to flush: " + config.host);
      });
  });
};

module.exports = flush;