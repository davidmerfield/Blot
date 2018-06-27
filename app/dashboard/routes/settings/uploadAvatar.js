var Upload = require("../../../upload");
var fs = require("fs-extra");

module.exports = function(req, res, next) {
  if (!req.files || !req.files.avatar) return next();

  var avatar = req.files.avatar;
  var blogID = req.blog.id;

  if (!avatar.size)
    return fs.unlink(avatar.path, function(err) {
      if (err) return next(err);

      next();
    });

  Upload(avatar.path, { blogID: blogID, folder: "avatars" }, function(
    err,
    url
  ) {
    if (err || !url)
      return next(
        new Error(
          "Something went wrong storing your avatar. Please try again or contact me."
        )
      );

    req.body.avatar = url;

    fs.unlink(avatar.path, function(err) {
      if (err) console.log("Error removing avatar");

      next();
    });
  });
};
