const Express = require("express");
const TemplateEditor = new Express.Router();
const config = require("config");
const bodyParser = require("body-parser").urlencoded({ extended: false });
const formJSON = require("helper/formJSON");
const Template = require("template");

TemplateEditor.param("viewSlug", require("./load/template-views"));
TemplateEditor.param("viewSlug", require("./load/template-view"));
TemplateEditor.param("templateSlug", require("./load/template"));
TemplateEditor.param("templateSlug", function (req, res, next) {
  res.locals.base = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.templateSlug}`;
  // used to filter messages sent from the iframe which contains a preview of the
  // template in the template editor, such that we only save the pages which are
  // part of the template.
  res.locals.previewOrigin = `https://preview-of-my-${req.template.slug}-on-${req.blog.handle}.${config.host}`;
  // we persist the path of the page of the template
  // last viewed by the user in the database
  res.locals.preview =
    res.locals.previewOrigin + (req.template.previewPath || "");
  next();
});

TemplateEditor.use("/:templateSlug", function (req, res, next) {
  if (req.template.localEditing && req.path !== "/local-editing")
    return res.redirect(res.locals.base + "/local-editing");

  res.locals.title = req.template.name;
  next();
});

TemplateEditor.use("/:templateSlug/:section", function (req, res, next) {
  res.locals.selected = {};
  res.locals.selected[req.params.section] = "selected";
  next();
});

TemplateEditor.route("/:templateSlug/settings")
  .all(require("./load/font-inputs"))
  .all(require("./load/theme"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))
  .post(
    bodyParser,
    require("./save/previewPath"),
    function (req, res, next) {
      console.log("here", req.body);
      let body = formJSON(req.body, Template.metadataModel);
      console.log("here", body);

      let newLocals = body.locals;
      let newPartials = body.partials;
      let locals = req.template.locals;
      let partials = req.template.partials;

      // Booleans
      if (newLocals.hide_dates) {
        newLocals.hide_dates = newLocals.hide_dates === "on";
      }

      for (let key in newLocals) locals[key] = newLocals[key];
      for (let key in newPartials) partials[key] = newPartials[key];

      req.locals = locals;
      req.partials = partials || {};

      next();
    },
    require("./save/fonts"),
    require("./save/theme"),
    function (req, res, next) {
      Template.update(
        req.blog.id,
        req.params.templateSlug,
        { locals: req.locals, partials: req.partials },
        function (err) {
          if (err) return next(err);
          res.message(req.baseUrl + req.url, "Success!");
        }
      );
    }
  )
  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/preview";
    res.locals.partials.sidebar = "template-editor/settings-sidebar";
    res.render("template-editor/layout");
  });

TemplateEditor.route("/:templateSlug/local-editing")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))
  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/local-editing";
    res.locals.partials.sidebar = "template-editor/settings-sidebar";
    res.locals.enabled = req.template.localEditing;
    res.locals.title = `Local editing - ${req.template.name}`;
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    const localEditing = !req.template.localEditing;

    Template.setMetadata(req.template.id, { localEditing }, function (err) {
      if (err) return next(err);

      if (localEditing) {
        Template.writeToFolder(req.blog.id, req.template.id, function () {
          // could we do something with this error? Could we wait to render the page?
          // it would be useful to have a progress bar here to prevent
          // busted folder state
          // we should also do something with the error
        });
      }

      res.message(
        res.locals.base + "/local-editing",
        "You can now edit the template locally!"
      );
    });
  });

TemplateEditor.route("/:templateSlug/rename")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))

  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/rename";
    res.locals.partials.sidebar = "template-editor/settings-sidebar";
    res.locals.title = `Rename - ${req.template.name}`;
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    Template.setMetadata(req.template.id, { name: req.body.name }, function (
      err
    ) {
      if (err) return next(err);
      res.message(res.locals.base + "/settings", "Renamed template!");
    });
  });

TemplateEditor.route("/:templateSlug/share")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))

  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/share";
    res.locals.partials.sidebar = "template-editor/settings-sidebar";
    res.locals.title = `Share - ${req.template.name}`;
    res.locals.shareURL = `${config.protocol}${config.host}/settings/template/share/${res.locals.template.shareID}`;
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    if (req.template.shareID) {
      Template.dropShareID(req.template.shareID, function (err) {
        if (err) return next(err);
        res.message(res.locals.base + "/share", "Unshared template!");
      });
    } else {
      Template.createShareID(req.template.id, function (err) {
        if (err) return next(err);
        res.message(res.locals.base + "/share", "Shared template!");
      });
    }
  });

TemplateEditor.route("/:templateSlug/delete")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))

  .get(function (req, res, next) {
    res.locals.partials.yield = "template-editor/delete";
    res.locals.partials.sidebar = "template-editor/settings-sidebar";
    res.locals.title = `Delete - ${req.template.name}`;
    res.render("template-editor/layout");
  })
  .post(function (req, res, next) {
    Template.drop(req.blog.id, req.template.slug, function (err) {
      if (err) return next(err);
      res.message("/settings/template", "Deleted template!");
    });
  });

TemplateEditor.use("/:templateSlug/source-code", require("./source-code"));

TemplateEditor.use(function (err, req, res, next) {
  res.status(400).send("Error: " + err.message || "Error");
});

module.exports = TemplateEditor;
