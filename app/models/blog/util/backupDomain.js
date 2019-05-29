module.exports = function(host) {
  if (!host) return host;
  
  return host.indexOf("www.") === -1
    ? "www." + host
    : host.slice("www.".length);
};
