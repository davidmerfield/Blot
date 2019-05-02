// This script will edit the ID of a blog
// Run this on my blogs in production first
// before incrementally rolling it out to
// ensure all blogs have IDs which are guuids

// Things to think about:

// acquire a sync lock for the blog before doing any of this
// any logged in sessions, any blog info in a session will need to be reset

// template keys, owners, lists of templates
// domain key, handle key
// client databases, etc...
// blog search engine keys
// blog entry keys
// rename /blogs/{id} directory
// rename /static/{id} file directory

// 'template:owned_by:' + blogID,
// 'handle:' + blog.handle,
// 'domain:' // also www version...
// "blog:" + blogID + ":dropbox:account";

// git client should just work

// Redis set whoses members are the blog IDs
// connected to this dropbox account.
// function blogsKey(account_id) {
//   return "clients:dropbox:" + account_id;
// }

// The git client uses User ID so it'll continue to work

// we also need to edit all template IDs stored against stuff
// e.g. the blog.template property.
// e.g. the templates:owned_by:X values

var debug = require("debug")("blot:scripts:set-blog-id");

var switchDropboxClient = require('./switchDropboxClient');
var loadBlog = require('./loadBlog');
var updateBlog = require('./updateBlog');
var updateUser = require('./updateUser');
var renameKeys = require('./renameKeys');
var moveDirectories = require('./moveDirectories');

if (require.main === module) {
  var oldBlogID = process.argv[2];
  var newBlogID = process.argv[3];

  main(oldBlogID, newBlogID, function(err) {
    if (err) throw err;

    console.log("Done!");
    process.exit();
  });
}

function main(oldBlogID, newBlogID, callback) {
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
          updateBlog(newBlogID, function(err) {
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
}

module.exports = main;