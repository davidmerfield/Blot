var request = require("request");
var Blog = require("blog");

module.exports = function verify(domain, callback) {
  Blog.getBy({ domain: domain }, function(err, blog) {
    if (err) return callback(err);

    if (!blog) return callback(new Error("No blog with domain " + domain));

    var options = {
      uri: "http://" + domain + "/verify/domain-setup",
      timeout: 1000,
      maxRedirects: 5
    };

    request(options, function(err, res, body) {
      if (err) return callback(err);

      if (body !== blog.handle)
        return callback(
          new Error("Mismatch for " + domain + " with handle " + blog.handle)
        );

      callback(null);
    });
  });
};
