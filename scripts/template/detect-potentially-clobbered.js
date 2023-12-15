const fs = require("fs-extra");
const localPath = require("helper/localPath");

const Template = require("models/template");
const Blog = require("models/blog");

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

  console.log("turning on local editing for template...");
  console.log(template);

  Template.setMetadata(template.id, { localEditing: true }, function (err) {
    if (err) return callback(err);

    console.log("reading old template from folder");
    readFromFolder(
      blog.id,
      pathUpperExists ? pathUpper : pathLower,
      function (err) {
        if (err && err.message.startsWith("No files found in")) {
          return callback();
        }

        if (err) return callback(err);
        callback();
      }
    );
  });
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
