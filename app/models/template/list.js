var debug = require("debug")("blot:template:list");
var key = require("./key");
var client = require("client");
var get = require("./get");
var async = require("async");

// The list of possible template choices for a given blog.
// Accepts a blog ID and returns an array of templates.
module.exports = function list(blogID, callback) {
  client
    .batch()
    .smembers(key.publicTemplates)
    .smembers(key.blogTemplates(blogID))
    .exec(function(err, templateIDs) {
      if (err) return callback(err);

      debug(blogID, templateIDs);
      // Redis returns two arrays, the first containing
      // public template IDs (i.e. Blot's) and the second
      // containg this blog's template ids. Now we merge them.
      templateIDs = templateIDs[0].concat(templateIDs[1]);

      async.map(templateIDs, get, callback);
    });
};
