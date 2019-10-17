var get = require("../get/blog");
var Template = require("../../app/models/template");

// will create a copy of templateID for the blog passed as first argument
// username templateID [templateName]

if (require.main === module) {
  var blogIdentifier = process.argv[2];
  var templateID = process.argv[3];
  var newName = process.argv[4] || "";

  if (!blogIdentifier)
    throw new Error(
      "Please pass a blog identifier (handle) as first argument to this script"
    );

  if (!templateID)
    throw new Error(
      "Please pass the template ID of the template you'd like to copy as the second argument to this script"
    );

  get(blogIdentifier, function(err, user, blog) {
    if (err || !blog) throw err || new Error('No blog');
    main(blog.id, templateID, newName, function(err) {
      if (err && err.message.indexOf("already exists") > -1) {
        throw new Error(
          "Please pass a new name as third argument. This template is named the same as one which already exists..."
        );
      }

      if (err) throw err;

      process.exit();
    });
  });
}
function main(blogID, templateID, newName, callback) {
  Template.getMetadata(templateID, function(err, template) {
    if (err || !template) throw err || new Error("No template " + templateID);

    template.cloneFrom = templateID;
    template.owner = blogID;
    newName = newName || template.name;

    Template.create(blogID, newName, template, function(err) {
      if (err) return callback(err);

      console.log("Copied template", templateID, "to blog", blogID);
      callback(null);
    });
  });
}
