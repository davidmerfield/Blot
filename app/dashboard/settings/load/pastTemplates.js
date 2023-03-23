const arrayify = require("helper/arrayify");
const config = require("config");
const Template = require("models/template");
const async = require("async");

module.exports = function (req, res, next) {
  res.locals.templates = [];
  const otherBlogIDs = req.user.blogs.filter((id) => id !== req.blog.id);

  console.log(otherBlogIDs);

  async.eachSeries(
    ["SITE", ...otherBlogIDs],
    function (ownerID, next) {
      Template.getTemplateList(ownerID, function (err, templates) {
        templates = templates.filter(function (template) {
          return !template.isPublic && template.owner === ownerID;
        });

        templates = templates.map((template) => {
          template.isMine = ownerID === "SITE";
          return template;
        });
        
        // Turn the dictionary of templates returned
        // from the DB into a list that Mustache can render
        templates = arrayify(templates, function (template) {
          template.nameLower = template.name.toLowerCase();

          template.editURL = "/template/" + template.slug;

          template.previewURL =
            "https://preview-of-" +
            template.slug +
            "-on-" +
            req.blog.handle +
            "." +
            config.host;
        });

        // Sort templates alphabetically,
        // with my templates above site tmeplates
        templates.sort(function (a, b) {
          const aName = a.name.trim().toLowerCase();

          const bName = b.name.trim().toLowerCase();

          if (aName < bName) return -1;

          if (aName > bName) return 1;

          return 0;
        });

        res.locals.templates = res.locals.templates.concat(templates);

        next();
      });
    },
    next
  );
};
