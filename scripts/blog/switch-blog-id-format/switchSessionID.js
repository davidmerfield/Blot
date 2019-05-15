var debug = require("debug")("blot:scripts:set-blog-id:switchSessionID");
var Keys = require("../../redis/keys");
var client = require("client");
var async = require("async");

module.exports = function switchSessionID(oldBlogID, newBlogID, callback) {
  var multi = client.multi();

  debug(oldBlogID, newBlogID);

  Keys("sess:*", function(err, keys) {
    debug(keys);

    async.each(
      keys,
      function(key, next) {
        debug(key);
        client.get(key, function(err, session) {
          if (err || !session) return next(err);

          debug(session);

          try {
            session = JSON.parse(session);
          } catch (e) {
            return next();
          }

          if (!session || session.blogID !== oldBlogID) return next();

          if (session[oldBlogID]) {
            delete session[oldBlogID];
            session[newBlogID] = {};
          }

          session.blogID = newBlogID;
          session = JSON.stringify(session);

          debug("saving new", session);
          client.set(key, session, next);
        });
      },
      function(err) {
        if (err) return callback(err);
        multi.exec(callback);
      }
    );
  });
};
