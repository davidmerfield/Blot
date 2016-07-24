// This regex
// Replaces unescaped amerpersands (and leaves escaped ones)
// I found the regex here:
// http://stackoverflow.com/questions/636781/any-pitfalls-with-this-regex-that-matches-ampersands-not-already-encoded
module.exports = function (str) {
  return str.replace(/&(?!#?[a-zA-Z0-9]+;)/g,'&amp;');
};