const bodyParser = require("body-parser").urlencoded({
  extended: false,
  limit: "1mb",
});
const Express = require("express");
const SourceCode = new Express.Router();
const Template = require("template");
const formJSON = require("helper/formJSON");
const extend = require("helper/extend");
const async = require("async");

SourceCode.use(function (req, res, next) {
  res.locals.partials.sidebar = "template-editor/source-code/sidebar";
  res.locals.partials.header = "template-editor/source-code/header";
  next();
});

SourceCode.param("viewSlug", require("./load/template-views"));
SourceCode.param("viewSlug", require("./load/template-view"));

SourceCode.route("/")
  .get(require("./load/template-views"))
  .get(function (req, res) {
    if (res.locals.views[0] && res.locals.views[0].name) {
      return res.redirect(
        res.locals.base + "/source-code/" + res.locals.views[0].name + "/edit"
      );
    }

    res.locals.partials.yield = "template-editor/source-code/edit";
    res.render("template-editor/layout");
  });

SourceCode.route("/create")
  .get(require("./load/template-views"))
  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/source-code/create";
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    const name = req.body.name;

    if (req.params.viewSlug === "package.json") {
      return next(new Error("You cannot name a view package.json"));
    }

    Template.getView(req.template.id, name, function (err, view) {
      // We recieve an error when the view doesn't exist
      // so don't exit in case of error here.
      view = view || {};

      let content = view.content || "";
      let url = view.url;

      // Determine the default URL for a new view:
      // foo.html -> /foo
      // foo.rss  -> /foo.rss
      // .html    -> /.html
      if (!url && name.endsWith(".html") && name.length > ".html".length) {
        url = "/" + name.slice(0, -1 * ".html".length);
      } else if (!url) {
        url = "/" + view.name;
      }

      Template.setView(req.template.id, { name, url, content }, function (err) {
        if (err) return next(err);
        res.redirect(res.locals.base + "/source-code/" + name + "/edit");
      });
    });
  });

SourceCode.route("/:viewSlug/edit")
  .get(function (req, res) {
    res.locals.title = `${req.view.name} - ${req.template.name}`;
    res.locals.partials.yield = "template-editor/source-code/edit";
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    var view = formJSON(req.body, Template.viewModel);

    view.name = req.view.name;

    if (req.params.viewSlug === "package.json") {
      Template.package.save(
        req.template.id,
        JSON.parse(view.content),
        function (err, views) {
          async.eachSeries(
            Object.keys(views),
            function (name, next) {
              Template.getView(req.template.id, name, function (err, view) {
                // getView returns an error if the view does not exist
                // We want to be able to create new views using local editing
                // we so ignore this error, and create the view object as needed
                view = view || {};
                view.name = view.name || name;
                for (var i in views[name]) view[i] = views[name][i];

                view.url = view.url || "/" + view.name;

                Template.setView(req.template.id, view, next);
              });
            },
            function (err) {
              if (err) return next(err);
              res.send("Saved changes!");
            }
          );
        }
      );
    } else {
      Template.setView(req.template.id, view, function (err) {
        if (err) return next(err);

        res.send("Saved changes!");
      });
    }
  });

SourceCode.route("/:viewSlug/rename")
  .get(function (req, res, next) {
    if (req.params.viewSlug === "package.json") {
      return next(new Error("You cannot rename package.json"));
    }

    res.locals.partials.yield = "template-editor/source-code/rename";
    res.locals.title = `Rename - ${req.view.name} - ${req.template.name}`;
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    if (req.params.viewSlug === "package.json") {
      return next(new Error("You cannot rename package.json"));
    }

    var view = formJSON(req.body, Template.viewModel);

    view.locals = view.locals || {};

    extend(view).and(req.view);

    var newName = view.name;
    var oldName = req.params.viewSlug;

    Template.getView(req.template.id, newName, function (err, existingView) {
      if (existingView && !err)
        return next(new Error("A view called " + newName + " already exists"));

      Template.setView(req.template.id, view, function (err) {
        if (err) return next(err);

        Template.dropView(req.template.id, oldName, function (err) {
          if (err) return next(err);

          res.message(
            res.locals.base + "/source-code/" + newName + "/edit",
            "Saved changes!"
          );
        });
      });
    });
  });

SourceCode.route("/:viewSlug/delete")
  .get(function (req, res) {
    res.locals.partials.yield = "template-editor/source-code/delete";
    res.locals.title = `Delete - ${req.view.name} - ${req.template.name}`;
    res.render("template-editor/layout");
  })
  .post(bodyParser, function (req, res, next) {
    Template.dropView(req.template.id, req.view.name, function (err) {
      if (err) return next(err);
      res.redirect(res.locals.base + "/source-code");
    });
  });

module.exports = SourceCode;
