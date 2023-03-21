var Typeset = require("typeset");
var cache = {};

module.exports = (input) => {
  let output = cache[input];

  if (output) return output;

  output = Typeset(input, {
    disable: ["hyphenate", "ligatures"],
    ignore: "textarea, input",
  });

  return output;
};
