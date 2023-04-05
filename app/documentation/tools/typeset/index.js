const modules = {
  quotes: require("./quotes"),
  punctuation: require("./punctuation"),
};

const eachTextNode = require("./eachTextNode");

module.exports = ($) => {
  for (const i in modules) {
    eachTextNode($, modules[i], { ignore: "textarea, input" });
  }
};
