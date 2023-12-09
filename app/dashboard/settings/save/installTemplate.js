const Template = require("models/template");
const Blog = require("models/blog");
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = function (req, res, next) {
  const template = req.body.template;

  Blog.set(req.blog.id, { template }, function () {
    res.message(
      "/dashboard/" + req.blog.handle + "/template",
      "Installed template"
    );

    res.locals.templatesInYourFolder.forEach(async t => {
      // read the package.json file
      const pathsToPackage = [
        `/templates/${t.slug}/package.json`,
        `/Templates/${t.slug}/package.json`
      ];

      let pathToPackageJson;

      for (let i = 0; i < pathsToPackage.length; i++) {
        const path = pathsToPackage[i];
        if (await fs.pathExists(localPath(req.blog.id, path))) {
          pathToPackageJson = path;
          break;
        }
      }

      if (!pathToPackageJson) return;

      const packageJson = await fs.readJson(
        localPath(req.blog.id, pathToPackageJson)
      );

      if (t.id === template && packageJson.enabled === true) return;

      if (t.id !== template && packageJson.enabled !== true) return;

      const updatedPackageJSON = JSON.stringify(
        { ...packageJson, enabled: t.id === template },
        null,
        2
      );

      const client = require("clients")[req.blog.client];

      // we create a fake client to write the template files directly
      // to the blog's folder if the user has not configured a client
      if (!req.blog.client || !client) {
        fs.outputFile(
          localPath(pathToPackageJson),
          updatedPackageJSON,
          callback
        );
      } else {
        client.write(
          req.blog.id,
          pathToPackageJson,
          updatedPackageJSON,
          function (err) {
            if (err) console.log(err);
            console.log("disabled template", t.slug);
          }
        );
      }
    });
  });
};
