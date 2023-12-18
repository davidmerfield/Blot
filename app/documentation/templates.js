const config = require("config");
const fs = require("fs-extra");
const marked = require("marked");

const folderForTemplate = {
  blog: "david",
  magazine: "interviews",
  photo: "william",
  portfolio: "bjorn",
  reference: "frances"
};

const templatesDirectory = __dirname + "/../templates/latest";
const foldersDirectory = __dirname + "/../templates/folders";

module.exports = async (req, res, next) => {
  res.locals.allTemplates = fs
    .readdirSync(templatesDirectory)
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
    .readdirSync(foldersDirectory)
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

  if (req.params.template) {
    res.locals.template = res.locals.allTemplates.find(
      i => i.slug === req.params.template
    );

    try {
      const markdown = await fs.readFile(
        templatesDirectory + "/" + req.params.template + "/README",
        "utf8"
      );

      res.locals.README = marked(markdown);
    } catch (e) {}
  }

  if (req.params.folder) {
    res.locals.folder = res.locals.allFolders.find(
      i => i.slug === req.params.folder
    );
  }

  next();
};
