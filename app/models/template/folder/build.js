var basename = require("path").basename;
var fs = require("fs");
var helper = require("helper");
var _ = require("lodash");
var mime = require("mime");
var extend = helper.extend;
var makeID = require("./makeID");
var create = require("./create");
var update = require("./update");
var async = require("async");
var set = require("./view").set;
var isOwner = require("./isOwner");

function build(owner, templateName, dir, callback) {
  var save;
  var templateID = makeID(owner, templateName);
  var info = JSON.parse(fs.readFileSync(dir + "package.json", "utf-8"));
  var views = _.cloneDeep(info.views);

  delete info.views;

  if (!info.name) {
    return callback("Please specify the package name");
  }

  isOwner(owner, templateName, function(err, exists) {
    if (!exists) {
      save = create.bind(null, owner, helper.capitalise(templateName), info);
    } else {
      save = update.bind(null, owner, helper.capitalise(templateName), info);
    }

    save(function(err) {
      if (err) return callback(err);

      var viewFiles = fs
        .readdirSync(dir)
        .filter(function(name) {
          return name[0] !== "." && name !== "package.json";
        })
        .map(function(name) {
          return dir + "/" + name;
        });

      async.each(
        viewFiles,
        function(viewFile, next) {
          var viewContent = fs.readFileSync(viewFile, "utf-8");
          var viewName = basename(viewFile).slice(
            0,
            basename(viewFile).lastIndexOf(".")
          );

          var view = {
            name: viewName,
            type: mime.lookup(basename(viewFile)),
            content: viewContent
          };

          if (view.name.slice(0, 1) === "_") {
            view.name = view.name.slice(1);
          }

          if (views && views[view.name]) {
            var newView = views[view.name];
            extend(newView).and(view);
            view = newView;
          }

          set(templateID, view, next);
        },
        function(err) {
          if (err) return callback(err);
          require("../cache/empty")();
          callback(null);
        }
      );
    });
  });
}

module.exports = build;
