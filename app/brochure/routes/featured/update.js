var request = require("request");
var Blog = require("blog");

// Think about version control!

// Should only run in production, will pull in live
// whether or not domain is still connected to Blot
// fetch latest post date and template information.
// Can be run every hour...
function update(callback) {
  var sites = require(result);

  async.filter(
    sites,
    function(site, next) {},
    function(err, sites) {
      fs.outputJson(result);
      // Empty any existing responses
      cache.flush(config.host, function(err) {
        if (err) console.warn(err);
      });
    }
  );
}

function verify(domain, callback) {
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
}

module.exports = update;
