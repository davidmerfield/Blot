var parseBody = require("body-parser").urlencoded({ extended: false });
var Template = require("template");
var loadTemplate = require("./loadTemplate");

module.exports = function(server) {
  server
    .route("/template/:template/local-editing")

    .all(loadTemplate)

    .get(function(req, res) {
      if (!req.template.localEditing)
        return res.redirect("/template/" + req.template.slug + "/settings");

      res.locals.partials.yield = "template/local-editing";
      res.render("template");
    })

    .post(parseBody, function(req, res, next) {
      Template.update(
        req.blog.id,
        req.template.slug,
        { localEditing: false },
        function(err) {
          if (err) return next(err);

          res.message(req.path, "Disabled local editing");
        }
      );
    });
};
