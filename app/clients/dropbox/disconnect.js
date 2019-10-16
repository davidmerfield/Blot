var createClient = require("./util/createClient");
var database = require("./database");
var Blog = require("blog");
var debug = require("debug")("clients:dropbox");
var Sync = require("sync");

// Dont write tests for this or you'll need to regenerate
// an access token for Travis and it'll be annoying. Just
// test it on the development server.
module.exports = function disconnect(blogID, callback) {
  // Make sure we don't create something unexpected
  // by messing with a blog mid-sync. This might fail
  // we need to surface a clear error message to the user.
  Sync(blogID, function(err, folder, done) {
    if (err) return callback(err);

    debug("getting account info");
    database.get(blogID, function(err, account) {
      if (err) return done(err, callback);

      debug("resetting client setting");
      Blog.set(blogID, { client: "" }, function(err) {
        if (err) return done(err, callback);

        debug("dropping blog from database");

        database.drop(blogID, function() {
          if (err) return done(err, callback);

          if (!account) {
            debug("the user chose Dropbox but did not connect their account");
            return done(null, callback);
          }

          debug("listing blogs with this account", account.account_id);
          database.listBlogs(account.account_id, function(err, blogs) {
            if (err) return done(err, callback);

            // check if this is the last blog using this oauth token
            // then revoke it as needed.
            if (blogs.length) {
              if (err) return done(null, callback);
            }

            var client = createClient(account.access_token);

            client
              .authTokenRevoke()
              .then(function() {
                debug("token revoked successfully");
                done(null, callback);
              })
              .catch(function(err) {
                // you get an error revoking a revoked token
                debug("token failed to revoke", err);
                done(null, callback);
              });
          });
        });
      });
    });
  });
};
