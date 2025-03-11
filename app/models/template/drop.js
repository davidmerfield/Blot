var getAllViews = require("./getAllViews");
var ensure = require("helper/ensure");
var client = require("models/client");
var key = require("./key");
var makeID = require("./util/makeID");
var Blog = require("models/blog");

module.exports = function drop(owner, templateName, callback) {
  var templateID = makeID(owner, templateName);
  var multi = client.multi();

  ensure(owner, "string").and(templateID, "string").and(callback, "function");

  getAllViews(templateID, function (err, views, metadata) {
    if (err) return callback(err);

    multi.srem(key.blogTemplates(owner), templateID);
    multi.srem(key.publicTemplates(), templateID);
    multi.del(key.metadata(templateID));
    multi.del(key.urlPatterns(templateID));
    multi.del(key.allViews(templateID));

    if (metadata.shareID) {
      multi.del(key.share(metadata.shareID));
    }

    for (var i in views) {
      multi.del(key.view(templateID, views[i].name));
      multi.del(key.url(templateID, views[i].url));
    }

    multi.exec(function (err) {
      Blog.set(metadata.owner, { cacheID: Date.now() }, function (err) {
        callback(err, "Deleted " + templateID);
      });
    });
  });
};
