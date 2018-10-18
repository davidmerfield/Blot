var basename = require("path").basename;
var helper = require("helper");
var fs = require("fs-extra");
var async = require("async");
var mime = require("mime");
var async = require("async");
var mime = require("mime");
var _ = require("lodash");
var ensure = helper.ensure;
var blogDir = helper.blogDir;
var extend = helper.extend;

var Blog = require("blog");

var set = require("./view").set;
var isOwner = require("./isOwner");
var makeID = require("./util/makeID");
var create = require("./create");
var update = require("./update");

var MAX_SIZE = 2.5 * 1000 * 1000; // 2.5mb

function read(blogID, folder, callback) {
  // Create a new template if it doesn't exist, otherwise
  // update an existing template with the contents of package.json
  prepareTemplate(blogID, folder, function(err, templateID, views) {
    if (err) return callback(err);

    fs.readdir(folder, function(err, contents) {
      if (err) return callback(err);

      // We remove system files and large files
      async.filter(contents, validViewFiles(folder), function(err, views) {
        // We read the contents of each file as save it
        async.each(views, saveView(templateID, folder), callback);
      });
    });
  });
}

function prepareTemplate(blogID, folder, callback) {

  var templateID = makeID(blogID, basename(folder));

  get(templateID, function(err, template){

    fs.readJson(folder + '/package.json', function(err, ){

      name: "string",
      description: "string",
      locals: "object"

      template.create()
      Object.assign(template,)

    });
  });
}

function saveView(templateID, folder) {
  return function(viewID, next) {
    fs.readFile(folder + "/" + viewID, "utf-8", function(err, content) {
      if (err) return next();
      set(
        templateID,
        {
          name: nameFrom(viewID),
          type: mime.lookup(viewID),
          content: content
        },
        next
      );
    });
  };
}
function validViewFiles(dir) {
  return function(item, next) {
    // Dotfile
    if (item[0] === ".") return next();

    // Package.json
    if (item === "package.json") return next();

    fs.stat(dir + "/" + item, function(err, stat) {
      if (err) return next(err);

      next(null, stat.size > MAX_SIZE);
    });
  };
}
function nameFrom(str) {
  var name = str;

  if (name.indexOf(".") > -1) name = name.slice(0, name.lastIndexOf("."));

  if (name[0] === "_") name = name.slice(1);

  return name;
}

function all(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  var templateDir = blogDir + "/" + blogID + "/templates";

  fs.readdir(templateDir, function(err, templates) {
    if (err && err.code === "ENOENT") return callback();

    if (err || !templates) return callback(err || "No templates");

    async.eachSeries(
      templates,
      function(template, next) {
        // Dotfile
        if (template.charAt(0) === ".") return next();

        var dir = templateDir + "/" + template;

        read(blogID, dir, function(err) {
          if (err) {
            // we need to expose this error
            // on the design page!
            console.log(err);
          }

          next();
        });
      },
      function() {
        var cacheID = Date.now();
        Blog.set(
          blogID,
          {
            cssURL: Blog.url.css(cacheID),
            scriptURL: Blog.url.js(cacheID),
            cacheID: cacheID
          },
          callback
        );
      }
    );
  });
}

function site(owner, templateName, dir, callback) {
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

read.all = all;
read.site = site;
module.exports = read;
