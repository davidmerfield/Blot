// This is useful for forming urls from entry properties
// e.g href="https://example.com?text={{#encodeURIComponent}}{{title}}{{/encodeURIComponent}}""
// and should be used by the social sharing buttons plugin when it exists

module.exports = function (req, callback) {
  return callback(null, function () {
    return function (text, render) {
      var encoded_text = "";

      text = render(text);

      try {
        encoded_text = encodeURIComponent(text);
      } catch (e) {
        return text;
      }

      return encoded_text;
    };
  });
};
