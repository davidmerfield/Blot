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
  req.folder.status("Creating a folder in Dropbox for your blog");

  client
    .filesCreateFolder({ path: folder, autorename: true })
    .then(function ({ result }) {
      req.unsavedAccount.folder = result.path_display;
      req.unsavedAccount.folder_id = result.id;
      // The front-end listens for this message, so if you change it
      // also update views/preparing.html
      req.folder.status("Created a folder in Dropbox for your blog");
      next();
    })
    .catch(next);
};
