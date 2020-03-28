var ensure = require("./ensure");
var fs = require("fs");
var _ = require("lodash");

module.exports = function parse(path) {
  ensure(path, "string");

  var _list = fs
    .readFileSync(path)
    .toString()
    .split("\n");

  var list = [];

  for (var i in _list) {
    var item = _list[i];

    if (item === "") continue;

    if (item.indexOf("#") === 0) continue;

    list.push(item);
  }

  return _.uniq(list);
};
