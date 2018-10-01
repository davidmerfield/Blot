var join = require("path").join;
var Dropbox = require("dropbox");
var database = require("./database");
var helper = require("helper");
var ensure = helper.ensure;
var Blog = require("blog");
var debug = require("debug")("clients:dropbox");
var Sync = require("sync");

module.exports = {
  disconnect: function(blogID, callback) {
    // check if this is the last blog using this oauth token
    // then revoke it as needed.

    Sync(blogID, function(err, folder, done) {
      // beware, this might be called twice...
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
            database.list_blogs(account.account_id, function(err, blogs) {
              if (err) return done(err, callback);

              if (blogs.length) {
                if (err) return done(null, callback);
              }

              var client = new Dropbox({ accessToken: account.access_token });

              debug("revoking token");

              client
                .authTokenRevoke()
                .then(function() {
                  debug("token revoked successfully");
                  done(null, callback);
                })
                .catch(function(err) {
                  // you get an error revoking a revoked token, funnily enough
                  debug("token failed to revoke", err);
                  done(null, callback);
                });
            });
          });
        });
      });
    });
  },

  write: function(blogID, path, contents, callback) {
    ensure(blogID, "string")
      .and(path, "string")
      .and(contents, "string")
      .and(callback, "function");

    database.get(blogID, function(err, account) {
      if (err) return callback(err);

      if (!account) return callback(new Error("No account"));

      var client = new Dropbox({ accessToken: account.access_token });

      client
        .filesUpload({
          contents: contents,
          autorename: false,
          mode: { ".tag": "overwrite" },
          path: join(account.folder || "/", path)
        })
        .then(function(res) {
          if (!res) return callback(new Error("No response from Dropbox"));
          callback();
        })
        .catch(function(err) {
          callback(err);
        });
    });
  },

  remove: function(blogID, path, callback) {
    ensure(blogID, "string")
      .and(path, "string")
      .and(callback, "function");

    database.get(blogID, function(err, account) {
      var client = new Dropbox({ accessToken: account.access_token });

      client
        .filesDelete({
          path: join(account.folder || "/", path)
        })
        .then(function(res) {
          if (!res) return callback(new Error("No response from Dropbox"));
          callback(null);
        })
        .catch(function(err) {
          // The file does not exist
          if (err.status === 409) return callback();

          callback(err);
        });
    });
  }
};
