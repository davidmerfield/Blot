const config = require("config");
const fs = require("fs-extra");
const marked = require("marked");

const templatesDirectory = __dirname + "/../templates/latest";
const foldersDirectory = __dirname + "/../templates/folders";

const { getMetadata } = require("models/template");

const getTemplate = slug =>
  new Promise((resolve, reject) => {
    getMetadata("SITE:" + slug, (err, template) => {
      if (err) return reject(err);

      resolve(template);
    });
  });

const folders = fs
  .readdirSync(foldersDirectory)
  .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
  .map(i => {
    return {
      name: i[0].toUpperCase() + i.slice(1),
      slug: i
    };
  });

const templates = fs
  .readdirSync(templatesDirectory)
  .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
  .map(
    async i =>
      new Promise((resolve, reject) => {
        getTemplate(i)
          .catch(reject)
          .then(template => {
            if (!template) return resolve();
            console.log("template", template);
            const demo_folder = template.locals.demo_folder;
            resolve({
              name: i[0].toUpperCase() + i.slice(1),
              slug: i,
              demo_folder
            });
          });
      })
  );

module.exports = async (req, res, next) => {
  res.locals.allTemplates = await Promise.all(templates);

  console.log("allTemplates", res.locals.allTemplates);

  // only include folders that are not used as templates
  res.locals.allFolders = folders.filter(
    i =>
      !Object.values(res.locals.allTemplates)
        .map(t => t.demo_folder)
        .includes(i.slug)
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
