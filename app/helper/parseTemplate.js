var _ = require("lodash");
var mustache = require("mustache");
var type = require("./type");

// My goal is to look at a template
// retrieve a list of variables and partials inside the template
// find those variables which I am allowed to fetch

// and store the relevant method and arguments
// neccessary to retrieve those at run time...

var modules = require("fs").readdirSync(__dirname + "/../blog/render/retrieve");

// Build a list of locals which blot will fetch
// returns a list like this:
// ['allEntries', 'recentEntries', 'allTags', 'archives', 'updated', 'appCSS', 'appJS', 'public']
var retrieveThese = _.filter(modules, function(name) {
  return name.charAt(0) !== "." && name !== "index.js";
})
  .map(function(name) {
    return name.slice(0, name.lastIndexOf("."));
  })
  .sort();

function parseTemplate(template) {
  var retrieve = {};
  var partials = {};
  var parsed;

  try {
    parsed = mustache.parse(template);
  } catch (e) {
    return { partials: partials, retrieve: retrieve };
  }

  process("", parsed);

  // This can be used to recursively
  // strip locals and partials we need
  // to fetch from the db before rendering
  // the temaplate
  function process(context, list) {
    if (context) context = context + ".";

    for (var i in list) {
      var token = list[i];

      // Is a partial
      if (token[0] === ">") {
        // this is dangerous but used to avoid fetching partials twice
        partials[token[1]] = null;
      }

      // Is a variable, '#' starts iterative blocks
      // '&' starts unescaped blocks
      if (token[0] === "name" || token[0] === "#" || token[0] === "&") {
        var variable = token[1];

        if (retrieveThese.indexOf(variable) > -1) retrieve[variable] = true;

        // console.log(context + variable);

        for (var x = 0; x < retrieveThese.length; x++) {
          var approved = retrieveThese[x];

          if (approved.indexOf(".") === -1) continue;

          // console.log('--', approved);

          if ((context + variable).indexOf(approved) > -1) {
            var fix = (context + variable).slice(
              (context + variable).indexOf(approved)
            );
            retrieve[fix] = true;
          }
        }

        // There are other tokens inside this block
        // process these recursively
        if (type(token[4], "array")) process(context + variable, token[4]);
      }
    }
  }

  return { partials: partials, retrieve: retrieve };
}

// console.log(parseTemplate('{{#title}}{{#menu}}{{active}}{{/menu}}{{/title}}'));
// console.log(parseTemplate('{{{appCSS}}}'));

module.exports = parseTemplate;
