var keys = require("../../redis/keys");
var client = require('client');
var async = require('async');

module.exports = function renameKeys(oldBlog, newBlogID, callback) {
  var multi = client.multi();
  var patterns = ["template:" + oldBlog.id + ":*", "blog:" + oldBlog.id + ":*"];

  async.map(patterns, keys, function(err, patterns) {
    patterns[0].forEach(function(key) {
      multi.RENAMENX(
        key,
        key
          .split("template:" + oldBlog.id + ":")
          .join("template:" + newBlogID + ":")
      );
    });

    patterns[1].forEach(function(key) {
      multi.RENAMENX(
        key,
        key.split("blog:" + oldBlog.id + ":").join("blog:" + newBlogID + ":")
      );
    });

    multi.set("handle:" + oldBlog.handle, newBlogID);
    multi.rename(
      "template:owned_by:" + oldBlog.id,
      "template:owned_by:" + newBlogID
    );

    // also set the www subdomain alternate key...
    if (oldBlog.domain) {
      multi.set("domain:" + oldBlog.domain, newBlogID);

      if (oldBlog.domain.indexOf("www.") === 0)
        multi.set("domain:" + oldBlog.domain.slice("www.".length), newBlogID);
      else multi.set("domain:" + "www." + oldBlog.domain, newBlogID);
    }

    multi.exec(callback);
  });
};