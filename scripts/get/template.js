const getBlog = require("./blog");
const Template = require("models/template");

// either takes a template id, e.g. blog_xyz:template_abc
// or a blog identifier. If we find a tempalte, return it
// otherwise list the ids of the templates for that blog
module.exports = function get (identifier, callback) {
  Template.getMetadata(identifier, function (err, template) {
    const blogIdentifier =
      template && template.owner ? template.owner : identifier;

    getBlog(blogIdentifier, function (err, user, blog, url) {
      if (err) return callback(err);

      if (template) return callback(err, user, blog, template, url);

      // print a list of template ids
      Template.getTemplateList(blog.id, function (err, templates) {
        if (err) return callback(err);

        callback(
          new Error(
            `No template with id ${identifier} found. Templates for ${
              blog.id
            } are: ${templates.map(t => t.id).join("\n")}`
          )
        );
      });
    });
  });
};
