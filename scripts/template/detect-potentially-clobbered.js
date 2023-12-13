const fs = require("fs-extra");
const localPath = require("helper/localPath");

const each = require("../each/template");
const get = require("../get/template");

const readFromFolder = require("models/template/readFromFolder");

const main = (blog, template, callback) => {
  if (template.localEditing !== false) {
    console.log(template.id, "is already set to edit locally");
    return callback();
  }

  const pathUpper = localPath(blog.id, "/Templates/" + template.slug);
  const pathLower = localPath(blog.id, "/templates/" + template.slug);

  const pathUpperExists = fs.existsSync(pathUpper);
  const pathLowerExists = fs.existsSync(pathLower);

  if (!pathUpperExists && !pathLowerExists) {
    console.log(template.id, "does not have a folder");
    return callback();
  }

  const newTemplate = {
    isPublic: false,
    name: template.name + " (backup)",
    slug: template.slug + "-backup",
    cloneFrom: template.id
  };

  console.log("would create new template", newTemplate);

  Template.create(
    req.blog.id,
    newTemplate.name,
    newTemplate,
    function (err, newTemplate) {
      if (err) return next(err);

      console.log("turning on local editing for template...");
      Template.setMetadata(template.id, { localEditing: true }, function (err) {
        if (err) return callback(err);

        console.log("reading old template from folder");
        readFromFolder(
          blog.id,
          pathUpperExists ? pathUpper : pathLower,
          function (err) {
            if (err) return callback(err);

            console.log("restored all views for", newTemplate.id);

            if (blog.template !== template.id) {
              console.log("template", template.id, "is not active");
              return callback();
            }

            console.log("setting new template as active");
            Blog.set(blog.id, { template: newTemplate.id }, function (err) {
              if (err) return callback(err);

              console.log("set new template as active");
              callback();
            });
          }
        );
      });
    }
  );
};

if (require.main === module) {
  // handle a specific template
  if (process.argv[2]) {
    get(process.argv[2], function (err, user, blog, template) {
      if (err) throw err;
      main(blog, template, function (err) {
        if (err) throw err;
        process.exit();
      });
    });
  } else {
    each(
      (user, blog, template, next) => main(blog, template, next),
      err => {
        if (err) throw err;
        process.exit();
      }
    );
  }
}
