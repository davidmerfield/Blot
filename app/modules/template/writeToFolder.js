var helper = require("../../helper");
var ensure = helper.ensure;
var joinpath = require("path").join;
var async = require("async");
var Template = require("../../models/template");
var callOnce = helper.callOnce;
var Blog = require("blog");

function writeToFolder(blogID, templateID, callback) {
  ensure(blogID, "string")
    .and(templateID, "string")
    .and(callback, "function");

  Template.isOwner(blogID, templateID, function(err, owner) {
    if (err) return callback(err);

    if (!owner) return callback(badPermission(blogID, templateID));

    Template.getAllViews(templateID, function(err, views, metadata) {
      if (err) return callback(err);

      if (!views || !metadata) return callback(noTemplate(blogID, templateID));

      makeClient(blogID, function(err, client) {
        if (err) {
          return callback(err);
        }

        var dir = joinpath("Templates", metadata.slug);

        // Reset the folder before writing. This fixes a bug in which
        // there were two views with the same name, but different extension.
        client.remove(blogID, dir, function(err) {
          if (err) {
            return callback(err);
          }

          async.eachOfSeries(
            views,
            function(view, name, next) {
              if (!view.name || !view.type || !view.content) return next();

              write(blogID, client, dir, view, next);
            },
            callback
          );
        });
      });
    });
  });
}

function makeClient(blogID, callback) {
  var clients = require("clients");

  Blog.get({ id: blogID }, function(err, blog) {
    var client = clients[blog.client];

    if (!blog.client || !client)
      return callback(new Error("No client for this blog"));

    return callback(null, client);
  });
}

function write(blogID, client, dir, view, callback) {
  ensure(client, "object")
    .and(dir, "string")
    .and(view, "object")
    .and(callback, "function");

  callback = callOnce(callback);

  // eventually I should just store
  // the goddamn filename and avoid this bullSHIT
  var extension = ".html";

  if (view.type === "text/css") extension = ".css";
  if (view.type === "application/xml") extension = ".rss";
  if (view.type === "application/rss+xml") extension = ".rss";
  if (view.type === "application/xml" && view.name === "sitemap")
    extension = ".xml";
  if (view.type === "application/javascript") extension = ".js";
  if (view.type === "text/plain") extension = ".txt";

  var path = joinpath(dir, view.name + extension);
  var content = view.content;

  client.write(blogID, path, content, callback);
}

function badPermission(blogID, templateID) {
  return new Error("No permission for " + blogID + " to write " + templateID);
}

function noTemplate(blogID, templateID) {
  return new Error("No template for " + blogID + " and " + templateID);
}

module.exports = writeToFolder;
