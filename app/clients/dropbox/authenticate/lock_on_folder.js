var Sync = require("sync");
var debug = require("debug")("clients:dropbox:lock_on_folder");

module.exports = {
  acquire: function(req, res, next) {
    debug("attempting to grab sync");

    Sync(req.blog.id, function(err, folder, done) {
      if (err) return next(err);

      debug("main function invoked");

      req.on_complete = function() {
        done(null, function() {
          // callback required...
        });
      };

      next();
    });
  },

  release: function(req, res, next) {
    debug("Calling sync on_complete!");
    req.on_complete();
    next();
  }
};
