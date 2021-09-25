var Mustache = require("mustache");
var ensure = require("helper/ensure");

var ERROR = require("./error");
var OVERFLOW = "Maximum call stack size exceeded";

// This function basically wraps mustache
// and gives me some nice error messages...
module.exports = function render(content, locals, partials) {
  ensure(content, "string").and(locals, "object").and(partials, "object");

  var output;

  try {
    output = Mustache.render(content, locals, partials);
  } catch (e) {
    if (e.message === OVERFLOW) {
      throw ERROR.INFINITE();
    } else if (e.message.indexOf("Unclosed tag") === 0) {
      throw ERROR.UNCLOSED();
    } else {
      throw ERROR();
    }
  }

  return output;
};
