var helper = require("helper");
var redis = require("client");
var Blog = require("blog");
var debug = require("debug")("clients:dropbox:database");
var async = require("async");
var ensure = helper.ensure;
var Model, database;

Model = {
  // We use the account ID to work out which
  // sites need to be synced when we recieve
  // a webhook from Dropbox.
  account_id: "string",

  // We store the user's Dropbox account
  // email address to help them identify
  // which dropbox account they have connected.
  email: "string",

  // This token is used to authenticate
  // requests to Dropbox's API
  access_token: "string",

  // If Blot encounters certains errors when
  // calling Dropbox's API we store the value.
  // Some errors which require user attention
  // include missing folders or revoked access.
  // This is an HTTP status code, e.g. 409
  // and is reset to zero after a successful sync
  error_code: "number",

  // Date stamp for the last successful
  // sync of this site.
  last_sync: "number",

  // True if Blot has full access to the user's
  // Dropbox folder, false if we only have
  // access to a folder in their Apps folder.
  // This is used to determine to which oauth
  // authentication route we send the user.
  full_access: "boolean",

  // This is the folder we show to the
  // user on the clients configuration
  // page. This isn't dependable since
  // the user can rename their site's
  // folder. We update it with each sync
  folder: "string",

  // This is a dropbox-generated ID for
  // the user's site folder. If the user
  // has given us app folder permission,
  // and they only have one site, then it will
  // be blank (effectively root). If the
  // user has given us full folder permission
  // and uses their entire Dropbox for blot,
  // it will also be blank.
  folder_id: "string",

  // This is a dropbox-generated cursor
  // which we pass to the dropbox api
  // to retrieve a list of changes to their
  // site's folder. It will be an empty string
  // before the user syncs their folder for
  // the first time. It will be reset if the
  // user removes their folder.
  cursor: "string"
};

function get(blogID, callback) {
  redis.hgetall(accountKey(blogID), function(err, account) {
    if (err) return callback(err, null);

    if (!account) return callback(null, null);

    // Restore the types of the
    // account properties before calling back.
    for (var i in Model) {
      if (Model[i] === "number") account[i] = parseInt(account[i]);

      if (Model[i] === "boolean") account[i] = account[i] === "true";
    }

    return callback(null, account);
  });
}

function listBlogs(account_id, callback) {
  var blogs = [];

  debug("Getting blogs conencted to Dropbox account", account_id);

  redis.SMEMBERS(blogsKey(account_id), function(err, members) {
    if (err) return callback(err);

    debug("Found these blog IDs", members);

    async.eachSeries(
      members,
      function(id, next) {
        Blog.get({ id: id }, function(err, blog) {
          if (err || !blog || blog.client !== "dropbox") {
            debug("Could not find a blog in the DB for", id);
            return next();
          }

          debug("Found a blog in the DB for", id);
          blogs.push(blog);
          next();
        });
      },
      function(err) {
        callback(err, blogs);
      }
    );
  });
}



function set(blogID, changes, callback) {
  var multi = redis.multi();

  debug("Setting dropbox account info for blog", blogID);

  get(blogID, function(err, account) {
    if (err) return callback(err);

    account = account || {};

    if (
      account.account_id &&
      changes.account_id &&
      account.account_id !== changes.account_id
    ) {
      debug(
        "The user's account has changed, remove the old one and add the new one"
      );
      multi.srem(blogsKey(account.account_id), blogID);
    }

    for (var i in changes) account[i] = changes[i];

    if (changes.account_id) {
      debug("Adding blog id to the list of blogs for this Dropbox account");
      multi.sadd(blogsKey(changes.account_id), blogID);
    } else {
      debug("Not adding blog id to the list of blogs for this Dropbox account");
    }

    ensure(account, Model, true);

    debug("Saving this account");
    multi.hmset(accountKey(blogID), account);
    multi.exec(callback);
  });
}

function drop(blogID, callback) {
  get(blogID, function(err, account) {
    var multi = redis.multi();

    // Deregister this blog from the set containing
    // the blog IDs associated with a particular dropbox
    // account. If we SREM the last item from a set, redis also
    // deletes the set. So don't worry about an additional
    // operation to delete this set.
    if (account && account.account_id)
      multi.srem(blogsKey(account.account_id), blogID);

    // Remove all the dangerous Dropbox account information
    // including the OAUTH token used to interact with
    // Dropbox's API. As I understand it, this is all we
    // need to remove. We should also encourage the user
    // to revoke the token on
    multi.del(accountKey(blogID));
    multi.exec(callback);
  });
}


// JSON which stores useful information
// information about this particular blog & dropbox account
// combination, e.g. root directory and access token.
function accountKey(blogID) {
  return "blog:" + blogID + ":dropbox:account";
}

// A set whoses members are the blog ids
// connected to this dropbox account.
function blogsKey(account_id) {
  return "clients:dropbox:" + account_id;
}


database = {
  set: set,
  drop: drop,
  get: get,
  listBlogs: listBlogs
};

module.exports = database;
