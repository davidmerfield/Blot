var render = require("./main");
var helper = require("helper");
var type = helper.type;
var TAG = "{{";

// Recursively render all the locals in the view.
// This was a really dumb idea. I would like to stop.
// In order to do this, check the database for template
// locals which contain the mustache tag and remove them.
module.exports = function renderLocals(locals) {
  var partials = locals.partials;

  (function handle(obj) {
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
  })(locals);

  return locals;
};
