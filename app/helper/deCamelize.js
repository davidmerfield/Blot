module.exports = function deCamelize(string) {
  string = string || "";
  return string.replace(/^[a-z]|[A-Z]/g, function(v, i) {
    return i === 0 ? v.toUpperCase() : " " + v.toLowerCase();
  });
};
