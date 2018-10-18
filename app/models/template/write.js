var helper = require("helper");
var async = require("async");
var view = require("./view");
var Blog = require("blog");
var get = require("./get");
var fs = require("fs-extra");
var localPath = helper.localPath;
var debug = require("debug")("template:write");

module.exports = function write(blogID, templateID, callback) {
  debug(blogID, templateID);
  get(templateID, function(err, template) {
    if (err) return callback(err);

    if (template.owner !== blogID) {
      err = new Error("You do not have permission");
      err.code = "EBADPERM";
      return callback(err);
    }

    getWriteFile(blogID, template.slug, function(err, writeFile) {
      if (err) return callback(err);

      view.getAll(templateID, function(err, views) {
        if (err) return callback(err);

        debug(blogID, templateID, "writing all views...");

        async.eachOfSeries(views, writeFile, callback);
      });
    });
  });
};

function getWriteFile(blogID, slug, callback) {
  var clients = require("clients");
  var dir = "/Templates/" + slug;
  var client;

  Blog.get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    if (!blog.client || !clients[blog.client]) {
      debug(blogID, "no client, just writing to folder", blog.client);
      client = {};
      client.write = function(blogID, path, content, callback) {
        fs.outputFile(localPath(blogID, path), content, callback);
      };
    } else {
      debug("using the client", blog.client);
      client = clients[blog.client];
    }

    callback(null, function writeFile(view, name, callback) {
      var extension;

      // In future, store the damn extension. This is bullshit.
      switch (view.type) {
        case "text/css":
          extension = ".css";
          break;
        case "application/xml":
          if (view.name === "sitemap") {
            extension = ".xml";
          } else {
            extension = ".rss";
          }
          break;
        case "application/javascript":
          extension = ".js";
          break;
        case "text/plain":
          extension = ".txt";
          break;
        default:
          extension = ".html";
      }

      debug("writing", dir + "/" + view.name + extension, view.content);

      client.write(
        blogID,
        dir + "/" + view.name + extension,
        view.content,
        callback
      );
    });
  });
}
