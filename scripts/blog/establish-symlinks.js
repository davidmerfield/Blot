var symlinks = require("../../app/models/blog/symlinks");
var config = require("config");

function main(blog, callback) {
  var symlinksToAdd = [];
  var symlinksToRemove = [];

  if (blog.handle) symlinksToAdd.push(blog.handle + "." + config.host);
  if (blog.domain) symlinksToAdd.push(blog.domain);

  symlinks(blog.id, symlinksToAdd, symlinksToRemove, callback);
}

if (require.main === module)
  require("./purge-s3/util/cli")(main, { skipAsk: true });

module.exports = main;
