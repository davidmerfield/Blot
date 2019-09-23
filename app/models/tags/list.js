var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");

module.exports = function getAll(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var tags = [];

  client.smembers(key.all(blogID), function(err, allTags) {
    if (err) throw err;

    if (!allTags || !allTags.length) return callback(null, tags);

    var multi = client.multi();
    var names = [];

    allTags.forEach(function(tag) {
      multi.smembers(key.tag(blogID, tag));
      names.push(key.name(blogID, tag));
    });

    multi.mget(names);

    multi.exec(function(err, res) {
      if (err) throw err;

      var pretty = res.pop();

      for (var i = 0; i < res.length; i++) {
        if (!res[i].length) continue;

        tags.push({
          name: pretty[i],
          slug: allTags[i],
          entries: res[i]
        });
      }

      return callback(null, tags);
    });
  });
};
