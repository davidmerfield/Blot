module.exports = function(req, callback) {
  return callback(null, function() {
    return function(text, render) {
      var extension;
      var ends_with = Ends_With(text);
      var starts_with = Starts_With(text);

      if (ends_with(".css")) extension = ".css";

      if (ends_with(".js")) extension = ".js";

      if (!starts_with("/")) text = "/" + text;

      if (extension)
        text = text + "?cache={{cacheID}}&amp;extension=" + extension;

      return render(text);
    };
  });
};

var assert = require("assert");

function Ends_With(str) {
  return function(token) {
    return str.slice(-token.length) === token;
  };
}

function Starts_With(str) {
  return function(token) {
    return str.slice(0, token.length) === token;
  };
}
assert(Ends_With("abc")("abc"));
assert(Ends_With("abc")("ab") === false);
assert(Ends_With("abc.txt")(".txt"));

assert(Starts_With("abc")("abc"));
assert(Starts_With("abc")("bc") === false);
assert(Starts_With("")(""));
