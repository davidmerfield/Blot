const config = require("config");
const fs = require("fs-extra");

const folderForTemplate = {
  blog: "david",
  magazine: "interviews",
  photo: "william",
  portfolio: "bjorn",
  reference: "frances"
};

module.exports = (req, res, next) => {
  res.locals.allTemplates = fs
    .readdirSync(__dirname + "/../templates/latest")
    .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
    .map(i => {
      return {
        name: i[0].toUpperCase() + i.slice(1),
        slug: i,
        preview:
          config.protocol +
          "preview-of-" +
          req.params.template +
          "-on-" +
          i +
          "." +
          config.host,
        folder: folderForTemplate[i]
      };
    });

  res.locals.allFolders = fs
    .readdirSync(__dirname + "/../templates/folders")
    .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
    .map(i => {
      return {
        name: i[0].toUpperCase() + i.slice(1),
        slug: i,
        preview:
          config.protocol +
          "preview-of-" +
          req.params.template +
          "-on-" +
          i +
          "." +
          config.host,
        folder: folderForTemplate[i]
      };
    });

  next();
};
