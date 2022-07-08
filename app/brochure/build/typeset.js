var Typeset = require("typeset");
module.exports = (input) => {
  let output = Typeset(input, {
    disable: ["hyphenate", "ligatures"],
    ignore: "textarea, input",
  });
  return output;
};
