const config = require("config");

// These converters do not require any external
// software (i.e. pandoc) to function
let converters = [require("./html"), require("./img"), require("./webloc")];

if (config.pandoc.bin) {
  converters.push(require("./docx"));
  converters.push(require("./odt"));
  converters.push(require("./markdown"));
} else {
  converters.push(require("./markdown-without-pandoc"));
}

module.exports = converters;
