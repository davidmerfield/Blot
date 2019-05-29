module.exports = function(host) {  
  return host.indexOf("www.") === -1
    ? "www." + host
    : host.slice("www.".length);
};
