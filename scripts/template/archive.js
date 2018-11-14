var eachBlog = require("../each/blog");
var Template = require("../../app/models/template");
var Blog = require("../../app/models/blog");
var fs = require("fs-extra");
var templateDir = require("path").resolve(__dirname + "/../../app/templates");

// This script is used to archive one of Blot's included templates
// It will create a copy of the template for each blog on which it
// is currently used (preserving the existing blog as-is) and then
// drop the template from the list of available templates for new
// users, or for existing users who were not using the template.

if (require.main === module) {
  main(process.argv[2], function(err) {
    if (err) throw err;

    process.exit();
  });
}

function main(name, callback) {
  var templateID = "SITE:" + name;

  if (!fs.statSync(templateDir + "/" + name).isDirectory())
    return callback(new Error("Could not find global template " + name));

  Template.getMetadata(templateID, function(err, template) {
    if (err) return callback(err);

    if (!template)
      return callback(
        new Error("There is no template in the database with id: " + templateID)
      );

    eachBlog(
      function(user, blog, next) {
        if (blog.template !== templateID) return next();

        var newTemplateID = blog.id + ":" + name;
        console.log("Creating template...");

        Template.create(
          blog.id,
          name,
          {
            isPublic: false,
            name: name,
            cloneFrom: blog.template
          },
          function(err) {
            if (err) return next(err);

            // We rename the template to include the case-preserved
            // original name. If we do this initially, there is a strange
            // duplicate template bug for unknown reasons.
            Template.setMetadata(
              newTemplateID,
              { name: template.name },
              function(err) {
                if (err) return next(err);

                Template.getMetadata(newTemplateID, function(err, template) {
                  console.log("Created template", template.id, template.name);

                  Blog.set(blog.id, { template: newTemplateID }, function(err) {
                    if (err) return next(err);

                    console.log("Saved cloned template");
                    next();
                  });
                });
              }
            );
          }
        );
      },
      function(err) {
        if (err) return callback(err);

        console.log(
          "Cloned template for sites currently using it successfully!",
          templateID
        );

        Template.drop("SITE", name, function(err) {
          if (err) return callback(err);
          console.log(
            "Removed template",
            name,
            "from database. You can safely archive the files in:\n\napp/templates/" +
              name
          );
          callback(null);
        });
      }
    );
  });
}

module.exports = main;
