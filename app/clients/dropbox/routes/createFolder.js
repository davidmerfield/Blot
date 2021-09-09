const fetch = require("isomorphic-fetch");
const Dropbox = require("dropbox").Dropbox;
var titleToFolder = require("./titleToFolder");

module.exports = function (req, res, next) {
  if (req.unsavedAccount.full_access === false && !req.otherBlogsUseAppFolder)
    return next();

  const client = new Dropbox({
    fetch: fetch,
  });

  client.auth.setAccessToken(req.unsavedAccount.access_token);

  var folder = "/" + titleToFolder(req.blog.title);

  client
    .filesCreateFolder({ path: folder, autorename: true })
    .then(function ({ result }) {
      req.unsavedAccount.folder = result.path_display;
      req.unsavedAccount.folder_id = result.id;

      next();
    })
    .catch(next);
};
