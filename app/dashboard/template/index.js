const config = require("config");
const Express = require("express");
const TemplateEditor = new Express.Router();
const parse = require("dashboard/parse");
const formJSON = require("helper/formJSON");
const Template = require("models/template");
const Blog = require("models/blog");
const archiver = require('archiver');

TemplateEditor.param("viewSlug", require("./load/template-views"));

TemplateEditor.param("viewSlug", require("./load/template-view"));

TemplateEditor.param("templateSlug", require("./load/template"));

TemplateEditor.use((req, res, next) => {
  res.locals.layout = "template/layout";
  res.locals.dashboardBase = res.locals.base;
  res.locals.breadcrumbs.add('Templates', 'template');
  next();
});

// Load templates for the sidebar
TemplateEditor.use(require('./templates'));

TemplateEditor.get('/', (req, res) => {
  res.render('template/index');
});


TemplateEditor.route('/deleted')
  .get((req, res) => {
    res.locals.breadcrumbs.add('Deleted', 'deleted');
    res.locals.title = 'Deleted templates';
    res.render('template/deleted');
  })
  .post(parse, (req, res, next) => {
    // either undelete a specific template
    // or purge all deleted templates
  });


TemplateEditor.route('/disable')
  .get((req, res) => {
    res.locals.breadcrumbs.add('Disable', 'disable');
    res.locals.title = 'Disable template';
    res.render('template/disable');
  })
  .post(parse, (req, res, next) => {
    // either disable the current template
    // or enable the current template
  });


TemplateEditor.route('/new')
  .get((req, res) => {
    res.locals.breadcrumbs.add('New template', 'new');
    res.locals.title = 'New template';
    res.render('template/new');
  })
  .post(parse, (req, res, next) => {
    Template.create(req.blog.id, req.body.name, (err, template) => {
      if (err) return next(err);
      res.redirect(req.baseUrl + '/' + template.slug);
    });
  });


TemplateEditor.use("/:templateSlug/:section", function (req, res, next) {
  res.locals.selected = {};
  res.locals.selected[req.params.section] = "selected";
  next();
});

TemplateEditor.route("/:templateSlug/install")
  .post(parse, function (req, res, next) {
    var templateID = req.body.template;
    if (!templateID) return next(new Error("No template ID"));
    var updates = {template: templateID};
    Blog.set(req.blog.id, updates, function (err) {
      if (err) return next(err);
      res.redirect("/sites/" + req.blog.handle + "/template/" + req.params.templateSlug);
    });
  });

TemplateEditor.route("/:templateSlug")
  .all(require("./load/font-inputs"))
  .all(require("./load/syntax-highlighter"))
  .all(require("./load/color-inputs"))
  .all(require("./load/index-inputs"))
  .all(require("./load/navigation-inputs"))
  .all(require("./load/dates"))
  .post(
    parse,
    require('./save/fork-if-needed'),
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
    res.render("template/settings");
  });

TemplateEditor.route("/:templateSlug/local-editing")
  .all(require("./load/font-inputs"))
  .all(require("./load/syntax-highlighter"))
  .all(require("./load/color-inputs"))
  .all(require("./load/index-inputs"))
  .all(require("./load/navigation-inputs"))
  .all(require("./load/dates"))

  .all(require("./load/dates"))
  .get(function (req, res) {
    res.locals.enabled = req.template.localEditing;
    res.locals.title = `Local editing - ${req.template.name}`;
    res.render("template/local-editing");
  })
  .post(parse, function (req, res, next) {
    Template.setMetadata(
      req.template.id,
      { localEditing: true },
      function (err) {
        if (err) return next(err);

        res.message(
          "/sites/" + req.blog.handle + "/template",
          "Transferred template <b>" + req.template.name + "</b> to your folder"
        );

        Template.writeToFolder(req.blog.id, req.template.id, function () {
          // could we do something with this error? Could we wait to render the page?
          // it would be useful to have a progress bar here to prevent
          // busted folder state
          // we should also do something with the error
        });
      }
    );
  });

  TemplateEditor.route('/:templateSlug/download')
  .get(function (req, res) {

    // create a zip file of the template on the fly and send it to the user
    // then in a streaming fashion, append the files to the zip file
    // then send the zip file to the user
    res.setHeader('Content-Disposition', `attachment; filename=${req.template.slug}-template.zip`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // Handle errors
    archive.on('error', function(err) {
      res.status(500).send({error: err.message});
    });

    // Pipe the archive data to the response.
    archive.pipe(res);

    Template.getAllViews(req.template.id, function (err, views, template) {
      if (err || !views || !template) return     res.status(500).send({error: err.message});

      // Add the views to the archive
      for (const view in views) {
        archive.append(views[view].content, { name: view });
      }

      // append the template JSON as 'package.json'
      archive.append(JSON.stringify(template, null, 2), { name: 'package.json' });

      // Finalize the archive
      archive.finalize();
    });
  });

  TemplateEditor.route("/:templateSlug/duplicate")
  .get(function (req, res) {
    res.locals.title = `Duplicate - ${req.template.name}`;
    res.locals.breadcrumbs.add("Duplicate", "duplicate");

    res.render("template/duplicate");
  })
  .post(parse, function (req, res, next) {
    //
    res.send('ok');
  });

TemplateEditor.route("/:templateSlug/rename")
  .get(function (req, res) {
    res.locals.title = `Rename - ${req.template.name}`;
    res.locals.breadcrumbs.add("Rename", "rename");
    res.render("template/rename");
  })
  .post(parse, function (req, res, next) {
    Template.setMetadata(
      req.template.id,
      { name: req.body.name },
      function (err) {
        if (err) return next(err);
        res.message(res.locals.base, "Renamed template!");
      }
    );
  });

  
TemplateEditor.route("/:templateSlug/links")
.get(require('dashboard/settings/load/menu') ,function (req, res) {
  res.locals.title = `Links - ${req.template.name}`;
  res.locals.breadcrumbs.add("Links", "links");
  res.render("template/links");
})
.post(parse, function (req, res, next) {
  
      res.message(res.locals.base, "Saved links!");
    
});

TemplateEditor.route("/:templateSlug/photo")
.get(function (req, res) {
  res.locals.title = `Photo - ${req.template.name}`;
  res.locals.breadcrumbs.add("Photo", "photo");
  res.render("template/photo");
})
.post(parse, function (req, res, next) {
  
      res.message(res.locals.base, "Saved photo!");
    
});

TemplateEditor.route("/:templateSlug/share")

  .get(function (req, res) {
    res.locals.title = `Share - ${req.template.name}`;
    res.locals.shareURL = `${req.protocol}://${req.hostname}/sites/share-template/${res.locals.template.shareID}`;
    res.locals.breadcrumbs.add("Share", "share");

    res.render("template/share");
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
  .all(require("./load/syntax-highlighter"))
  .all(require("./load/color-inputs"))
  .all(require("./load/index-inputs"))
  .all(require("./load/navigation-inputs"))
  .all(require("./load/dates"))

  .get(function (req, res, next) {
    res.locals.title = `Delete - ${req.template.name}`;
    res.locals.breadcrumbs.add("Delete", "delete");

    res.render("template/delete");
  })
  .post(function (req, res, next) {
    Template.drop(req.blog.id, req.template.slug, function (err) {
      if (err) return next(err);
      res.message(
        res.locals.dashboardBase + "/template",
        "Deleted template <b>" + req.template.name + "</b>"
      );
    });
  });

TemplateEditor.use("/:templateSlug/source-code", require("./source-code"));

TemplateEditor.use(function (err, req, res, next) {
  res.status(400).send("Error: " + err.message || "Error");
});

module.exports = TemplateEditor;
