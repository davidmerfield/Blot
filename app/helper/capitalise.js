module.exports = function capitalise(string) {
  string = string || "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};
