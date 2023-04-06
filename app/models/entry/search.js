const transliterate = require("transliteration");

module.exports = function (blogID, query, callback) {
  query = transliterate(query);
  callback(null, []);
};
