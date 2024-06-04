const config = require("config");
const fs = require("fs-extra");
const { marked } = require("marked");
const prettySize = require("helper/prettySize");
const templatesDirectory = __dirname + "/../templates/latest";
const archivedTemplatesDirectory = __dirname + "/../templates/past";
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
  .readdirSync(templatesDirectory).concat(fs.readdirSync(archivedTemplatesDirectory))
  .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
  .map(
    async i =>
      new Promise((resolve, reject) => {
        getTemplate(i)
          .catch(() => resolve())
          .then(template => {
            if (!template) return resolve();
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

  // only include folders that are not used as templates
  res.locals.allFolders = folders.filter(
    i =>
      !Object.values(res.locals.allTemplates)
        .map(t => t && t.demo_folder)
        .includes(i.slug)
  );

  console.log('HERE', res.locals.allFolders)

  if (req.params.template) {
    try {
      const template = res.locals.allTemplates.find(
        i => i.slug === req.params.template
      );

      if (!template) return next();

      res.locals.template = {
        ...template
      };

      const preview_host =
        "preview-of-" +
        req.params.template +
        "-on-" +
        template.demo_folder +
        "." +
        config.host;

      res.locals.template.preview = config.protocol + preview_host;
      res.locals.template.preview_host = preview_host;

      const zip_name = template.demo_folder + ".zip";
      const zip = "/folders/" + zip_name;
      const pathToZip = config.blot_directory + "/app/documentation/data" + zip;

      res.locals.template.zip = zip;
      res.locals.template.zip_name = zip_name;

      console.log(
        "pathToZip",
        pathToZip,
        "zipExists",
        fs.existsSync(pathToZip)
      );

      res.locals.template.zip_size = prettySize(
        fs.statSync(pathToZip).size / 1000,
        1
      );

      res.locals.template.README = marked.parse(
        await fs.readFile(
          templatesDirectory + "/" + req.params.template + "/README",
          "utf8"
        )
      );
    } catch (e) {}
  }

  if (req.params.folder) {
    const folder = folders.find(i => i.slug === req.params.folder);

    if (!folder) return next();

    res.locals.folder = { ...folder };

    res.locals.folder.preview_host = folder.slug + "." + config.host;
    res.locals.folder.preview =
      config.protocol + res.locals.folder.preview_host;

    const zip_name = folder.slug + ".zip";
    const zip = "/folders/" + zip_name;
    const pathToZip = config.blot_directory + "/app/documentation/data" + zip;

    res.locals.folder.zip = zip;
    res.locals.folder.zip_name = zip_name;
    res.locals.folder.zip_size = prettySize(
      fs.statSync(pathToZip).size / 1000,
      1
    );
  }

  next();
};
