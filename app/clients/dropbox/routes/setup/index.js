const sync = require("sync");
const STAGES = require("./stages");
const async = require("async");

module.exports = function (blog, account, next) {
  // I think the function signature can look like
  // we'll need to move some of the session stuff into
  // account, e.g. code, full_access.
  // function(blog, account, callback){ ... }
  // callback(null, blog, account);
  // the status and session stuff can happen here...
  async.waterfall(
    [
      function (callback) {
        // used to keep track of progress
        req.session.dropbox.status = {};
        req.status = {};
        STAGES.forEach(({ stage, active, done }) => {
          req.status[stage] = {
            active: () => {
              req.session.dropbox.status[stage] = "active";
              req.session.save();
              req.folder.status(active);
            },
            done: () => {
              req.session.dropbox.status[stage] = "done";
              req.session.save();
              req.folder.status(done);
            },
          };
        });

        sync(req.blog.id, function (err, folder, done) {
          if (err) return callback(err);

          req.done = done;
          account.folder = folder;
          callback(null, blog, account);
        });
      },
      start("token"),
      require("./token"),
      start("dropboxAccount"),
      require("./dropboxAccount"),
      start("moveExistingFiles"),
      require("./checkAppFolder"),
      require("./moveExistingFiles"),
      start("createFolder"),
      require("./createFolder"),
      start("writeExistingContents"),
      require("./writeExistingContents"),
      start("saveDropboxAccount"),
      require("./saveDropboxAccount"),
      function (req, res, next) {
        req.done(null, function (err) {
          if (err) {
            next(err);
          } else {
            delete req.session.dropbox;
            req.session.save();
            console.log("Released sync");
          }
        });
      },
    ],
    function (err) {
      console.log("here with err", err);
      if (req.done) {
        req.done(err, next);
      } else {
        next(err);
      }
    }
  );
};
