var chars = "abcdefghijklmnopqrstuvwxyz".split("");

module.exports = function randomString(len) {
  if (len === undefined) len = 16;
  var res = "";
  while (res.length < len)
    res += chars[Math.floor(Math.random() * chars.length)];
  return res;
};
