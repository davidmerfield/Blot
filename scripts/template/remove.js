var eachBlog = require("../each/blog");
var Template = require("../../app/models/template");
var Blog = require("../../app/models/blog");
var fs = require("fs-extra");
var templateDir = require("path").resolve(__dirname + "/../../app/templates");

if (require.main === module) {
  main(process.argv[2], function(err) {
    if (err) throw err;

    process.exit();
  });
}
function main(name, callback) {
  var templateID = "SITE:" + name;

  if (!fs.statSync(templateDir + "/" + name).isDirectory())
    return callback(new Error("Could not find template " + name));

  Template.get(templateID, function(err, template) {
    if (err) return callback(err);
    if (!template)
      return callback(new Error("There is no template " + templateID));

    eachBlog(
      function(user, blog, next) {
        if (blog.template !== templateID) return next();

        Template.create(blog.id, template.name, { cloneFrom: blog.template }, function(
          err,
          template
        ) {
          if (err) return next(err);

          console.log("Created template", template.id, template.name);

          Blog.set(blog.id, { template: template.id }, function(err) {
            if (err) return next(err);

            console.log("Saved cloned template");
            next();
          });
        });
      },
      function(err) {
        if (err) return callback(err);

        console.log(
          "Cloned template for sites currently using it successfully!",
          templateID
        );

        Template.drop(templateID, function(err) {
          if (err) return callback(err);
          console.log("Removed template", templateID);
          callback(null);
        });
      }
    );
  });
}

module.exports = main;
