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

var keys = require("../../redis/keys");
var async = require("async");
var client = require("../../../app/models/client");
var User = require("../../../app/models/user");
var Blog = require("../../../app/models/blog");
var debug = require("debug")("blot:scripts:set-blog-id");
var fs = require("fs-extra");
var localPath = require("helper").localPath;
var staticDirectory = require("config").blog_static_files_dir;

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

function switchDropboxClient(oldBlogID, newBlogID, callback) {
  // Redis Hash which stores the Dropbox account info
  client.hgetall("blog:" + oldBlogID + ":dropbox:account", function(err, keys) {
    if (err) return callback(err);

    if (!keys || !keys.account_id) {
      debug(oldBlogID, "was not configured to use the Dropbox client");
      return callback();
    }

    // Redis set whoses members are the blog IDs
    // connected to this dropbox account.
    client.smembers("clients:dropbox:" + keys.account_id, function(
      err,
      members
    ) {
      if (err) return callback(err);

      if (!members) return callback(new Error("No members"));

      if (members.indexOf(oldBlogID) === -1) return callback();

      client.multi()
        .srem("clients:dropbox:" + keys.account_id, oldBlogID)
        .sadd("clients:dropbox:" + keys.account_id, newBlogID)
        .exec(callback);
    });
  });
}

function loadBlog(oldBlogID, newBlogID, callback) {
  Blog.get({ id: oldBlogID }, function(err, oldBlog) {
    if (err) return callback(err);

    if (!oldBlog) return callback(new Error("No blog with ID: " + oldBlogID));

    Blog.get({ id: newBlogID }, function(err, existingBlog) {
      if (err) return callback(err);

      // We might want to be able to clobber and existing blog though...
      if (existingBlog)
        return callback(new Error("Existing blog with ID: " + existingBlog));

      callback(null, oldBlog);
    });
  });
}

function renameKeys(oldBlog, newBlogID, callback) {
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
}

function updateUser(uid, oldBlogID, newBlogID, callback) {
  debug("Retrieving user", uid);
  User.getById(uid, function(err, user) {
    if (err) return callback(err);

    if (!user) return callback(new Error("No user: " + uid));

    debug("Old list of blogs:", user.blogs);
    user.blogs = user.blogs.filter(function(id) {
      return id !== oldBlogID;
    });

    user.blogs.push(newBlogID);
    debug("New list of blogs:", user.blogs);

    User.set(user.uid, user, callback);
  });
}

function updateBlog(newBlogID, callback) {
  debug("Saving new ID as property of blog", newBlogID);
  Blog.set(newBlogID, { id: newBlogID }, callback);
}

function moveDirectories(oldBlogID, newBlogID, callback) {
  // This will be dangerous if oldBlog or newBlogID are empty strings
  if (!oldBlogID || !newBlogID)
    return callback(new Error("Pass valid blogs IDs to moveDirectories"));

  var oldBlogDir = localPath(oldBlogID, "/").slice(0, -1);
  var newBlogDir = localPath(newBlogID, "/").slice(0, -1);

  var oldStaticFilesDir = staticDirectory + "/" + oldBlogID;
  var newStaticFilesDir = staticDirectory + "/" + newBlogID;

  fs.ensureDirSync(oldBlogDir);
  fs.ensureDirSync(oldStaticFilesDir);

  if (fs.existsSync(newBlogDir)) {
    console.error(
      "The blog directory for new blog already exists, please remove it:\nrm -rf",
      newBlogDir
    );
    return callback(new Error("EEXISTS"));
  }

  if (fs.existsSync(newStaticFilesDir)) {
    console.error(
      "The static file directory for the new blog already exists, please remove it:\nrm -rf",
      newStaticFilesDir
    );
    return callback(new Error("EEXISTS"));
  }

  debug("Moving blog folder");
  debug("  Old: ", oldBlogDir);
  debug("  New: ", newBlogDir);

  fs.move(oldBlogDir, newBlogDir, function(err) {
    if (err) return callback(err);

    debug("Moving static files folder");
    debug("  Old: ", oldStaticFilesDir);
    debug("  New: ", newStaticFilesDir);

    fs.move(oldStaticFilesDir, newStaticFilesDir, callback);
  });
}
