var Typeset = require("typeset");
module.exports = (input) => {
  let output = Typeset(input, {
    disable: ["hyphenate"],
    ignore: "textarea, input",
  });
  return output;
};
