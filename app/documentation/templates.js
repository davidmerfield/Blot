const config = require("config");
const fs = require("fs-extra");
const { marked } = require("marked");
const prettySize = require("helper/prettySize");
const path = require("path");

const templatesDirectory = path.join(__dirname, "../templates/latest");
const archivedTemplatesDirectory = path.join(__dirname, "../templates/past");
const foldersDirectory = path.join(__dirname, "../templates/folders");
const { getMetadata } = require("models/template");

// Helper function to get template metadata
const getTemplate = async slug => {
  try {
    return await new Promise((resolve, reject) => {
      getMetadata("SITE:" + slug, (err, template) => {
        if (err) return reject(err);
        resolve(template);
      });
    });
  } catch (error) {
    return null;
  }
};

// Load folders
const loadFolders = async () => {
  const folderNames = await fs.readdir(foldersDirectory);
  return folderNames
    .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"))
    .map(i => ({
      name: i[0].toUpperCase() + i.slice(1),
      slug: i
    }));
};

// Load templates
const loadTemplates = async () => {
  const latestTemplateFiles = await fs.readdir(templatesDirectory);
  const archivedTemplateFiles = await fs.readdir(archivedTemplatesDirectory);
  const templateFiles = [...latestTemplateFiles, ...archivedTemplateFiles]
    .filter(i => !i.startsWith(".") && !i.endsWith(".js") && !i.endsWith(".md"));

  const templates = await Promise.all(templateFiles.map(async i => {
    const template = await getTemplate(i);
    if (!template) return null;
    const demo_folder = template.locals.demo_folder;
    return {
      name: i[0].toUpperCase() + i.slice(1),
      slug: i,
      demo_folder
    };
  }));

  return templates.filter(Boolean);
};

// Middleware function
module.exports = async (req, res, next) => {
  try {
    res.locals.allTemplates = await loadTemplates();
    res.locals.allFolders = (await loadFolders()).filter(
      folder => !res.locals.allTemplates.some(template => template.demo_folder === folder.slug)
    );

    if (req.params.template) {
      const template = res.locals.allTemplates.find(
        t => t.slug === req.params.template
      );

      if (template) {
        res.locals.template = { ...template };

        const preview_host =
          `preview-of-${req.params.template}-on-${template.demo_folder}.${config.host}`;
        res.locals.template.preview = `${config.protocol}${preview_host}`;
        res.locals.template.preview_host = preview_host;

        const zip_name = `${template.demo_folder}.zip`;
        const zip = `/folders/${zip_name}`;
        const pathToZip = path.join(config.blot_directory, "app/documentation/data", zip);

        if (await fs.pathExists(pathToZip)) {
          res.locals.template.zip = zip;
          res.locals.template.zip_name = zip_name;
          res.locals.template.zip_size = prettySize(
            (await fs.stat(pathToZip)).size / 1000,
            1
          );

          const readmePath = path.join(templatesDirectory, req.params.template, "README");
          if (await fs.pathExists(readmePath)) {
            res.locals.template.README = marked.parse(
              await fs.readFile(readmePath, "utf8")
            );
          }
        }
      }
    }

    if (req.params.folder) {
      const folder = res.locals.allFolders.find(f => f.slug === req.params.folder);

      if (folder) {
        res.locals.folder = { ...folder };

        res.locals.folder.preview_host = `${folder.slug}.${config.host}`;
        res.locals.folder.preview = `${config.protocol}${res.locals.folder.preview_host}`;

        const zip_name = `${folder.slug}.zip`;
        const zip = `/folders/${zip_name}`;
        const pathToZip = path.join(config.blot_directory, "app/documentation/data", zip);

        if (await fs.pathExists(pathToZip)) {
          res.locals.folder.zip = zip;
          res.locals.folder.zip_name = zip_name;
          res.locals.folder.zip_size = prettySize(
            (await fs.stat(pathToZip)).size / 1000,
            1
          );
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};