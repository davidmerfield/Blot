const fs = require("fs-extra");
const localPath = require("helper/localPath");

const each = require("../each/template");
const get = require("../get/template");

const main = (blog, template, callback) => {
  if (template.localEditing !== false) {
    console.log(template.id, "is already set to edit locally");
    return callback();
  }

  const pathUpper = localPath(blog.id, "/Templates/" + template.slug);
  const pathLower = localPath(blog.id, "/templates/" + template.slug);

  console.log("local path:", pathUpper);
  console.log("local path:", pathLower);

  if (fs.existsSync(pathUpper) || fs.existsSync(pathLower)) {
    console.log(template.id, "has a folder waiting to clobber");
  } else {
    console.log(template.id, "does not have a folder waiting to clobber");
    return callback();
  }

  // we need to duplicate the template and if it's the blog's active template,
  // we need to set the new template as the active one
  callback();
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
