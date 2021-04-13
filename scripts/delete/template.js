var Template = require("models/template");

var handle = process.argv[2];
var templateID = process.argv[3];

var get = require("../blog/get");

if (!handle) throw "Please pass the handle of the blog";

main(process.exit);

function main(callback) {
  get(handle, function (user, blog) {
    if (!blog) throw "No blog";

    if (!templateID) return list(user, blog, callback);

    console.log("... Dropping", templateID);

    Template.getMetadata(templateID, function (err, template) {
      if (err || !template) throw err || "No template with id " + templateID;

      Template.drop(blog.id, template.slug, function (err) {
        if (err) throw err;

        console.log("... dropped", template.slug);

        list(user, blog, callback);
      });
    });
  });
}

function list(user, blog, callback) {
  Template.getTemplateList(blog.id, function (err, templates) {
    if (err) throw err;

    templates = templates.filter(function (template) {
      return template.owner == blog.id;
    });

    console.log();

    console.log(user.name, blog.id, blog.handle);
    console.log();

    templates.forEach(function (template) {
      console.log("---------------------------------------");
      console.log("|      NAME:", template.name);
      console.log("|        ID:", template.id);
      console.log("|     OWNER:", template.owner);
      console.log("|      SLUG:", template.slug);
    });

    callback();
  });
}
