var mustache = require("mustache");
var type = require("helper/type");

function parseTemplate(template) {
  var locals = [];
  var partials = [];

  try {
    process(mustache.parse(template));
  } catch (e) {
    return { partials, locals };
  }

  function process(list, context = "") {
    if (context) context = context + ".";

    for (var token of list) {
      // Is a partial
      if (token[0] === ">") {
        // this is dangerous but used to avoid fetching partials twice
        const partial = token[1];
        if (!partials.includes(partial)) partials.push(partial);
      }

      // Is a variable, '#' starts iterative blocks
      // '&' starts unescaped blocks
      if (
        token[0] === "name" ||
        token[0] === "#" ||
        token[0] === "^" ||
        token[0] === "&"
      ) {
        // e.g. all_entries.length
        var variable = token[1];
        // e.g. all_entries
        var variableRoot =
          variable.indexOf(".") > -1 &&
          variable.slice(0, variable.indexOf("."));

        if (variable !== "." && !locals.includes(variable)) {
          locals.push(variable);
        }

        if (variableRoot && !locals.includes(variableRoot))
          locals.push(variableRoot);

        // There are other tokens inside this block
        // process these recursively
        if (type(token[4], "array")) process(token[4], context + variable);
      }
    }
  }

  return { partials, locals };
}

module.exports = parseTemplate;
