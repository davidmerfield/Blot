var avatars = require("./avatars");
var cached = require("./cached");
var detect = require("./detect");
var thumbnails = require("./thumbnails");

function main(blog, callback) {
  avatars(blog, function(err) {
    if (err) return callback(err);
    thumbnails(blog, function(err) {
      if (err) return callback(err);
      cached(blog, function(err) {
        if (err) return callback(err);
        detect(blog, callback);
      });
    });
  });
}

if (require.main === module) require("./util/cli")(main, { skipAsk: true });

module.exports = main;
