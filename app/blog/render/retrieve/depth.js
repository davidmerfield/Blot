// calculate the number of slashes in the input
// after decoding any uri-encoded-slashes if they exist
// and adding a leading slash and removing any trailing slashes
module.exports = function (req, callback) {
  return callback(null, function () {
    return function (text, render) {
      var depth = 1;

      try {
        // replace &#x2F; with /
        // remove trailing slashes
        // remove leading slash
        const input = render(text)
          .replace(/\/+$/, "")
          .replace(/&#x2F;/g, "/")
          .replace(/^\//, "");
        console.log("input", input);
        depth = input.split("/").length;
      } catch (e) {
        return depth;
      }

      return depth;
    };
  });
};
