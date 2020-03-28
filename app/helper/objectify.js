var _ = require("lodash");

module.exports = function objectify(sourceArr, manipulate) {
  var arr = _.cloneDeep(sourceArr),
    obj = {};

  for (var i in arr) {
    if (arr[i].id) {
      obj[arr[i].id] = arr[i];
    }

    if (arr[i].name) {
      obj[arr[i].name] = arr[i];
    }
  }

  return obj;
};
