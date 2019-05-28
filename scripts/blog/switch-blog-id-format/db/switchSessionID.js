var debug = require("debug")("blot:scripts:set-blog-id:switchSessionID");
var client = require("client");
var async = require("async");

module.exports = function switchSessionID(
  keys,
  multi,
  oldBlogID,
  newBlogID,
  callback
) {
  keys = keys.filter(function(key) {
    return key.indexOf("sess:") === 0;
  });

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
        multi.set(key, session);
        next();
      });
    },
    callback
  );
};
