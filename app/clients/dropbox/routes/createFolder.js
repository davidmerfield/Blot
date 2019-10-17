var createClient = require("../util/createClient");

module.exports = function(req, res, next) {
  if (req.unsavedAccount.full_access === false && !req.otherBlogsUseAppFolder)
    return next();

  var client = createClient(req.unsavedAccount.access_token);
  var folder = req.blog.title;

  folder = folder.split("/").join("");
  folder = folder.trim();

  client
    .filesCreateFolder({ path: "/" + folder, autorename: true })
    .then(function(res) {
      req.unsavedAccount.folder = res.path_display;
      req.unsavedAccount.folder_id = res.id;

      next();
    })
    .catch(next);
};
