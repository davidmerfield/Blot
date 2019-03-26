// Should only run in production, will pull in live whether
// or not domain is still connected to Blot. In future we
// could run other tests, e.g. to ensure an even balance of
// templates on the homepage. "sites" are a list of objects
// with the following relevant properties:
// { "link": "http://example.com", "host": "example.com" }

var request = require("request");
var Blog = require("blog");
var async = require("async");

function filter(sites, callback) {
  async.groupByLimit(
    sites,
    3,
    function(site, next) {
      verify(site.host, function(err) {
        next(null, err === null);
      });
    },
    function(err, result) {
      callback(err, result.true || [], result.false || []);
    }
  );
}

function verify(domain, callback) {
  Blog.get({ domain: domain }, function(err, blog) {
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
          new Error("Domain" + domain + " no longer connected to Blot")
        );

      callback(null);
    });
  });
}

module.exports = filter;
