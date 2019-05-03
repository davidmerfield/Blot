var debug = require("debug")("blot:scripts:set-blog-id");

var switchDropboxClient = require("./switchDropboxClient");
var loadBlog = require("./loadBlog");
var updateBlog = require("./updateBlog");
var updateUser = require("./updateUser");
var renameKeys = require("./renameKeys");
var renameTemplateIDs = require("./renameTemplateIDs");
var renameTransformerIDs = require("./renameTransformerIDs");
var moveDirectories = require("./moveDirectories");

if (require.main === module) {
  var oldBlogID = process.argv[2];
  var newBlogID = process.argv[3];

  if (!newBlogID) newBlogID = Date.now().toString();

  main(oldBlogID, newBlogID, function(err) {
    if (err) throw err;

    console.log("Done!");
    process.exit();
  });
}

function main(oldBlogID, newBlogID, callback) {
  if (!oldBlogID || !newBlogID)
    return callback(new Error("Pass oldBlogID and newBlogID"));

  debug("Switching blog with", oldBlogID, "to", newBlogID);
  loadBlog(oldBlogID, newBlogID, function(err, oldBlog) {
    if (err) return callback(err);

    debug("Switching dropbox client from", oldBlogID, "to", newBlogID);
    switchDropboxClient(oldBlogID, newBlogID, function(err) {
      if (err) return callback(err);

      debug("Renaming keys from", oldBlogID, "to", newBlogID);
      renameKeys(oldBlog, newBlogID, function(err) {
        if (err) return callback(err);

        debug("Updating list of blogs associated with user", oldBlog.owner);
        updateUser(oldBlog.owner, oldBlogID, newBlogID, function(err) {
          if (err) return callback(err);

          debug("Updating property of blogs with new ID", oldBlog.owner);
          updateBlog(oldBlog, newBlogID, function(err) {
            if (err) return callback(err);

            debug("Renaming old template IDs for", oldBlogID);
            renameTemplateIDs(oldBlog, newBlogID, function(err) {
              if (err) return callback(err);

              debug("Renaming Transformer stores for", oldBlogID);
              renameTransformerIDs(oldBlog, newBlogID, function(err) {
                if (err) return callback(err);

                debug("Moving blog and static directories for", oldBlogID);
                moveDirectories(oldBlogID, newBlogID, function(err) {
                  if (err) return callback(err);
                  callback();
                });
              });
            });
          });
        });
      });
    });
  });
}

module.exports = main;
