var type = require("./type");
var ensure = require("./ensure");

function extend(a) {
  if (a === undefined) a = {};

  return {
    and: function next(b) {
      softMerge(a, b);

      return extend(a);
    },
  };
}

// if property on a is set, use it,
// if not, use B's value
function softMerge(a, b) {
  ensure(a, "object").and(b, "object");

  for (var i in b) {
    if (type(a[i]) === "object" && type(b[i]) === "object") {
      softMerge(a[i], b[i]);
    }

    if (a[i] === undefined) {
      a[i] = b[i];
    }
  }
}


module.exports = extend;
