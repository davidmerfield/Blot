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

const folders = fs
  .readdirSync(foldersDirectory)
  .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
  .map(i => {
    return {
      name: i[0].toUpperCase() + i.slice(1),
      slug: i,
      folder: folderForTemplate[i]
    };
  });

const templates = fs
  .readdirSync(templatesDirectory)
  .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
  .map(i => {
    return {
      name: i[0].toUpperCase() + i.slice(1),
      slug: i,
      folder: folderForTemplate[i]
    };
  });

module.exports = async (req, res, next) => {
  res.locals.allTemplates = templates;

  // only include folders that are not used as templates
  res.locals.allFolders = folders.filter(
    i => !Object.values(folderForTemplate).includes(i.slug)
  );

  if (req.params.template) {
    res.locals.template = {
      ...templates.find(i => i.slug === req.params.template)
    };

    res.locals.template.preview =
      config.protocol +
      "preview-of-" +
      req.params.template +
      "-on-" +
      res.locals.template.folder +
      "." +
      config.host;

    try {
      const markdown = await fs.readFile(
        templatesDirectory + "/" + req.params.template + "/README",
        "utf8"
      );

      res.locals.README = marked(markdown);
    } catch (e) {}
  }

  if (req.params.folder) {
    res.locals.folder = { ...folders.find(i => i.slug === req.params.folder) };
  }

  next();
};
