var render = require("./main");
var type = require("helper/type");
var TAG = "{{";
var ensure = require("helper/ensure");

// Recursively render all the locals in
// the view. This is to ensure that variables
// inside stuff like pageTitle and entry.html
// are replaced with the values they should.
module.exports = function renderLocals(req, res, callback) {
  ensure(res, "object")
    .and(res.locals, "object")
    .and(res.locals.partials, "object")
    .and(callback, "function");

  var locals = res.locals;
  var partials = res.locals.partials;

  try {
    handle(res.locals);
  } catch (e) {
    return callback(null, req, res);
  }

  function handle(obj) {
    for (var i in obj) {
      // We want to skip partials now
      // Otherwise shit would break.
      // Technically we only need to check
      // this on the first level.
      if (i === "partials") continue;

      var local = obj[i];

      // Go deeper!
      if (type(local, "object") || type(local, "array")) {
        handle(obj[i]);
        continue;
      }

      if (type(local, "string") && local.indexOf(TAG) > -1) {
        // this needs to inherit context so entry can access
        // other tags etc...
        // Render this string local since it contains a tag

        // bits of the entry might not work, that's OK!

        try {
          obj[i] = render(local, locals, partials);
        } catch (e) {
          obj[i] = local;
        }
      }
    }
  }

  return callback(null, req, res);
};
