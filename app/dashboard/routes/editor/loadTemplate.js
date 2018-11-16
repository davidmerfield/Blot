var Template = require("template");
var config = require("config");
var helper = require("helper");
var arrayify = helper.arrayify;

module.exports = function(req, res, next) {
  var blogID = req.blog.id;

  // makeSlug is called twice (stupidly, accidentally)
  // in the process to create a template. This double encodes
  // certain characters like ø. It means that we need to run
  // makeSlug twice when looking up a template by its slug.
  // makeID calls makeSlug under the hood so we only need
  // to call it once ourselves.
  var name = helper.makeSlug(req.params.template);

  if (!name) return res.redirect("/settings/design");

  var templateID = Template.makeID(blogID, name);

  // This should probably be Template.owns(blogID, templateid)
  Template.isOwner(blogID, templateID, function(err, isOwner) {
    // Check the blog owns the template
    if (err || !isOwner) return res.redirect("/settings/design");

    Template.getMetadata(templateID, function(err, template) {
      if (
        template.localEditing &&
        req.path !== "/template/" + req.params.template + "/local-editing"
      ) {
        return res.redirect(
          "/template/" + req.params.template + "/local-editing"
        );
      }

      // Determine which HTML input we should show for each local
      // on the settings page.
      template.locals = arrayify(template.locals).map(function(local) {
        if (local.name.indexOf("size") > -1 || local.name.indexOf("height") > -1) {
          // show the number picker component for this local
          local.label = local.name.split('_').join(' ');
          local.label = local.label[0].toUpperCase() + local.label.slice(1);

          if (local.label === 'Page size') local.label = 'Number of posts per page';
          
          local.range = true;
        } else if (local.name.indexOf("color") > -1) {
          local.label = local.name.split('_').join(' ');
          local.label = local.label[0].toUpperCase() + local.label.slice(1);
          // show the color picker component for this local
          local.color = true;
        } else if (local.name.indexOf("font") > -1) {
          // show the font picker component for this local
          local.font = true;
          local.label = local.name.split('_').join(' ');
          local.label = local.label[0].toUpperCase() + local.label.slice(1);
          local.fonts = [
            {
              label: "Charter",
              value: "charter",
              selected: local.content === "charter" ? "selected" : ""
            },
            {
              label: "Helvetica",
              value: "Helvetica",
              selected: local.content === "Helvetica" ? "selected" : ""
            },
            {
              label: "Times New Roman",
              value: "times",
              selected: local.content === "times" ? "selected" : ""
            }
          ];
        } else {
          // use default template
          local.default = true;
        }

        return local;
      });

      req.template = template;

      template.baseUrl = "/template/" + encodeURIComponent(template.slug);
      template.preview = [
        "http://preview.my",
        template.slug,
        req.blog.handle,
        config.host
      ].join(".");

      res.locals.template = template;
      res.locals.partials.head = "partials/head";
      res.locals.partials.footer = "partials/footer";
      res.locals.partials.locals = "template/_locals";
      res.locals.partials.partial = "template/_partial";
      res.locals.partials.partials = "template/_partials";

      res.locals.partials.default = "template/_local-default";
      res.locals.partials.color = "template/_local-color";
      res.locals.partials.font = "template/_local-font";
      res.locals.partials.range = "template/_local-range";

      return next();
    });
  });
};
