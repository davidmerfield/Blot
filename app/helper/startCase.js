module.exports = function startCase(string) {
  string = string || "";
  string = string.split("-").join(" ");
  return string.charAt(0).toUpperCase() + string.slice(1);
};
