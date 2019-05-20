var Mustache = require("mustache");
var helper = require("helper");
var ensure = helper.ensure;

// Disables Mustache's escaping so {{html}} is now the same as {{{html}}}
// Why does Mustache offer escaping by default? It's to prevent HTML
// injection, e.g. a screename "<script>alert()</script>" would cause
// undesired JavaScript to run. Since you can only ever control your own
// site, this behaviour is less useful for Blot. In fact, it's caused a 
// number of confusing issues. For example, Mustache escapes slashes by
// default, which break a number of URL parsers and feed readers.
Mustache.escape = function(text) {return text;};

var ERROR = require("./error");
var OVERFLOW = "Maximum call stack size exceeded";

// This function basically wraps mustache
// and gives me some nice error messages...
module.exports = function render(content, locals, partials) {
  ensure(content, "string")
    .and(locals, "object")
    .and(partials, "object");

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
