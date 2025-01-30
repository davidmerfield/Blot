var client = require("models/client");
var ensure = require("helper/ensure");
var key = require("./key");

module.exports = function getAll(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var tags = [];

  console.time("Tags.list Listing tags");

  client.smembers(key.all(blogID), function (err, allTags) {
    if (err) throw err;

    if (!allTags || !allTags.length) return callback(null, tags);

    var multi = client.multi();
    var names = [];

    allTags.forEach(function (tag) {
      multi.smembers(key.tag(blogID, tag));
      names.push(key.name(blogID, tag));
    });

    multi.mget(names);

    console.timeEnd("Tags.list Listing tags");
    console.time("Tags.list Loading entries for each tag");

    multi.exec(function (err, res) {
      if (err) throw err;

      var pretty = res.pop();

      for (var i = 0; i < res.length; i++) {
        if (!res[i].length) continue;

        tags.push({
          name: pretty[i],
          slug: allTags[i],
          entries: res[i],
        });
      }

      console.timeEnd("Tags.list Loading entries for each tag");

      return callback(null, tags);
    });
  });
};
