// Think about
// - amerpsands in img srcs, do they still work?
// - amerpsands in slugs, do they still work?
module.exports = {
  // This regex replaces unescaped amerpersands (and leaves escaped ones)
  // I found the regex here:
  // http://stackoverflow.com/questions/636781/any-pitfalls-with-this-regex-that-matches-ampersands-not-already-encoded
  escape: function(text) {
    return text.replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;");
  },

  deDoubleEscape: function(text) {
    return text.split("&amp;amp;").join("&amp;");
  }
};
