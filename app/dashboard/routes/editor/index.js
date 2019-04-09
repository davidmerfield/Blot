var Template = require("template");
var Blog = require("blog");
var helper = require("helper");

module.exports = function(server) {
  require("./view")(server);
  require("./settings")(server);
  require("./local-editing")(server);

  server
    .route("/template/:template/share/:handle")
    .all(function(req, res, next) {
      Blog.get({ handle: req.params.handle }, function(err, blog) {
        if (err || !blog) return next(err || new Error("No blog"));

        if (blog.handle === req.blog.handle)
          return next(new Error("This is your template."));

        // makeSlug is called twice (stupidly, accidentally)
        // in the process to create a template. This double encodes
        // certain characters like ø. It means that we need to run
        // makeSlug twice when looking up a template by its slug.
        // makeID calls makeSlug under the hood so we only need
        // to call it once ourselves.
        var name = helper.makeSlug(req.params.template);
        var templateID = Template.makeID(blog.id, name);

        Template.getMetadata(templateID, function(err, template) {
          if (err || !blog) return next(err || new Error("No template"));

          res.locals.template = template;
          next();
        });
      });
    })

    .get(function(req, res) {
      res.render("template/share");
    })

    .post(function(req, res, next) {
      var template = res.locals.template;

      template.cloneFrom = res.locals.template.id;
      template.owner = req.blog.id;

      Template.create(req.blog.id, template.name, template, function(err) {
        if (err) return next(err);

        res.message("/settings/theme", "Created new template!");
      });
    });
};
