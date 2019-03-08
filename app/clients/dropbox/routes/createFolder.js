var createClient = require("../util/createClient");

module.exports = function(req, res, next) {
  if (req.unsavedAccount.full_access === false && !req.otherBlogsUseAppFolder)
    return next();

  var client = createClient(req.unsavedAccount.access_token);

  client
    .filesCreateFolder({ path: "/" + req.blog.title, autorename: true })
    .then(function(res) {
      req.unsavedAccount.folder = res.path_display;
      req.unsavedAccount.folder_id = res.id;

      next();
    })
    .catch(next);
};
