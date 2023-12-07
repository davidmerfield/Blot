const config = require("config");
const Express = require("express");
const TemplateEditor = new Express.Router();
const parse = require("dashboard/parse");
const formJSON = require("helper/formJSON");
const Template = require("models/template");

TemplateEditor.param("viewSlug", require("./load/template-views"));

TemplateEditor.param("viewSlug", require("./load/template-view"));

TemplateEditor.param("templateSlug", require("./load/template"));

TemplateEditor.param("templateSlug", function (req, res, next) {
  res.locals.dashboardBase = res.locals.base;
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

TemplateEditor.use((req, res, next) => {
  res.locals.layout = "template-editor/layout";
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
  .all(require("./load/syntax-highlighter"))
  .all(require("./load/color-scheme"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))
  .post(
    parse,
    require("./save/previewPath"),
    function (req, res, next) {
      let body = formJSON(req.body, Template.metadataModel);
      let newLocals = body.locals;
      let newPartials = body.partials;
      let locals = req.template.locals;
      let partials = req.template.partials;

      for (const local in locals) {
        if (
          typeof locals[local] === "boolean" &&
          newLocals[local] !== undefined
        )
          newLocals[local] = newLocals[local] === "on";
      }

      for (let key in newLocals) {
        // if locals[key] is an object, merge the newLocals[key] object into it
        // otherwise simply assign newLocals[key] to locals[key]
        // this makes it possible to update a single property of an object without
        // overwriting the entire object
        if (typeof locals[key] === "object") {
          for (let prop in newLocals[key]) {
            console.log("setting", key, prop, newLocals[key][prop]);
            locals[key][prop] = newLocals[key][prop];
          }
        } else {
          locals[key] = newLocals[key];
        }
      }

      for (let key in newPartials) partials[key] = newPartials[key];

      req.locals = locals;
      req.partials = partials || {};

      next();
    },
    require("./save/layout-inputs"),
    require("./save/syntax-highlighter"),
    require("./save/fonts"),
    require("./save/color-scheme"),
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
    res.render("template-editor/preview");
  });

TemplateEditor.route("/:templateSlug/local-editing")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))
  .get(function (req, res) {
    res.locals.enabled = req.template.localEditing;
    res.locals.title = `Local editing - ${req.template.name}`;
    res.render("template-editor/local-editing");
  })
  .post(parse, function (req, res, next) {
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
    res.locals.title = `Rename - ${req.template.name}`;
    res.render("template-editor/rename");
  })
  .post(parse, function (req, res, next) {
    Template.setMetadata(
      req.template.id,
      { name: req.body.name },
      function (err) {
        if (err) return next(err);
        res.message(res.locals.base + "/settings", "Renamed template!");
      }
    );
  });

TemplateEditor.route("/:templateSlug/share")
  .all(require("./load/font-inputs"))
  .all(require("./load/color-inputs"))
  .all(require("./load/layout-inputs"))
  .all(require("./load/dates"))

  .get(function (req, res) {
    res.locals.title = `Share - ${req.template.name}`;
    res.locals.shareURL = `${req.protocol}://${req.hostname}/dashboard/share-template/${res.locals.template.shareID}`;
    res.render("template-editor/share");
  })
  .post(parse, function (req, res, next) {
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
    res.locals.title = `Delete - ${req.template.name}`;
    res.render("template-editor/delete");
  })
  .post(function (req, res, next) {
    Template.drop(req.blog.id, req.template.slug, function (err) {
      if (err) return next(err);
      res.message(res.locals.dashboardBase + "/template", "Deleted template!");
    });
  });

TemplateEditor.use("/:templateSlug/source-code", require("./source-code"));

TemplateEditor.use(function (err, req, res, next) {
  res.status(400).send("Error: " + err.message || "Error");
});

module.exports = TemplateEditor;
