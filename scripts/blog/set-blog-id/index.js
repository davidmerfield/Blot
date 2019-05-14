var generateID = require("../../../app/models/blog/generateID");
var debug = require("debug")("blot:scripts:set-blog-id");
var async = require("async");
var updateBlog = require("./updateBlog");

if (require.main === module) {
  var oldBlogID = process.argv[2];
  var newBlogID = process.argv[3];

  if (!newBlogID) newBlogID = generateID();

  main(oldBlogID, newBlogID, function(err) {
    if (err) throw err;

    console.log("Done!");
    process.exit();
  });
}

function main(oldBlogID, newBlogID, callback) {
  if (!oldBlogID || !newBlogID)
    return callback(new Error("Pass oldBlogID and newBlogID"));

  var tasks = [
    require("./moveDirectories"),
    require("./renameBlogKeys"),
    require("./renameDomainKeys"),
    require("./renameHandleKeys"),
    require("./renameTemplateKeys"),
    require("./renameTransformerIDs"),
    require("./switchDropboxClient"),
    require("./updateUser")
  ].map(function(task) {
    return task.bind(null, oldBlogID, newBlogID);
  });

  debug("Migrating", oldBlogID, "to", newBlogID);

  async.parallel(tasks, function(err) {
    if (err) return callback(err);

    updateBlog(oldBlogID, newBlogID, callback);
  });
}

module.exports = main;
