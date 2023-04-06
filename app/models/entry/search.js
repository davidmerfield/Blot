const transliterate = require("transliteration");
const ensure = require("helper/ensure");

module.exports = function (blogID, query, callback) {
  ensure(blogID, "string").and(query, "string").and(callback, "function");

  query = transliterate(query);

  callback(null, []);
};
