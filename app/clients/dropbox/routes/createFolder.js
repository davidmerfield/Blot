var createClient = require("../util/createClient");
var titleToFolder = require('./titleToFolder');

module.exports = function(req, res, next) {
  if (req.unsavedAccount.full_access === false && !req.otherBlogsUseAppFolder)
    return next();

  var client = createClient(req.unsavedAccount.access_token);
  var folder = titleToFolder(req.blog.title);

  client
    .filesCreateFolder({ path: "/" + folder, autorename: true })
    .then(function(res) {
      req.unsavedAccount.folder = res.path_display;
      req.unsavedAccount.folder_id = res.id;

      next();
    })
    .catch(next);
};
