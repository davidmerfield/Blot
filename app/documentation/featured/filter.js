// Should only run in production, will pull in live whether
// or not domain is still connected to Blot. In future we
// could run other tests, e.g. to ensure an even balance of
// templates on the homepage. "sites" are a list of objects
// with the following relevant properties:
// { "link": "http://example.com", "host": "example.com" }

var config = require("config");
var request = require("request");
var Blog = require("models/blog");
var User = require("models/user");
var Template = require("models/template");
var async = require("async");
var latest_template_ids = require("fs")
  .readdirSync(__dirname + "/../../templates/latest")
  .map((i) => "SITE:" + i);

function filter(sites, callback) {
  async.groupByLimit(
    sites,
    3,
    function (site, next) {
      verify(site.host, function (err, template, joined) {
        if (err !== null) return next(null, false);

        site.template = {
          custom: latest_template_ids.indexOf(template.id) === -1,
          label: template.name,
          slug: template.slug,
        };

        site.joined = joined;

        next(null, true);
      });
    },
    function (err, result) {
      callback(err, result.true || [], result.false || []);
    }
  );
}

function verify(domain, callback) {
  console.log('Checking', domain);
  
  var options = {
    uri: "https://" + domain + "/verify/domain-setup",
    timeout: 1000,
    maxRedirects: 5,
  };

  request(options, function (err, res, body) {
    if (err) return callback(err);

    if (!body || body.indexOf(" ") > -1 || body.length > 100)
      return callback(new Error("domain disconnected"));

    if (config.environment === "development") {
      return callback(null, { id: "SITE:blog" }, new Date().getFullYear());
    }

    Blog.get({ domain: domain }, function (err, blog) {
      if (err) return callback(err);

      if (!blog) return callback(new Error("No blog with domain " + domain));

      if (!blog.template) {
        return callback(new Error("No template for blog"));
      }

      User.getById(blog.owner, function (err, user) {
        let joined = new Date().getFullYear();

        if (user && user.subscription && user.subscription.created) {
          joined = new Date(user.subscription.created * 1000).getFullYear();
        }

        Template.getMetadata(blog.template, function (err, template) {
          if (err) return callback(err);

          if (!template) {
            return callback(new Error("No template:" + blog.template));
          }

          if (!template.id) {
            console.log("no template id", blog, template);
            return callback(new Error("No template:" + blog.template));
          }

          if (body !== blog.handle)
            return callback(
              new Error("Domain" + domain + " no longer connected to Blot")
            );

          callback(null, template, joined);
        });
      });
    });
  });
}

module.exports = filter;
