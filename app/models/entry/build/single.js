var debug = require("debug")("blot:models:entry:build:single");
var Metadata = require("./metadata");
var Dependencies = require("./dependencies");
var helper = require("../../../helper");
var Plugins = require("./plugins").convert;
var ensure = helper.ensure;
var async = require('async');
var converters = require('../../../converters');

module.exports = function(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(callback, "function");

  async.each(converters, function(converter, next){

    if (!converter.is(path)) return next();

    converter.read(blog, path, options, function(err, html, stat) {

      debug('Blog:', blog.id, path, "back from converter");

      if (err) return callback(err);

      var parsed, metadata, dependencies;

      // Now we extract any metadata from the file
      // This modifies the 'contents' if it succeeds
      try {
        parsed = Metadata(html);
        metadata = parsed.metadata;
        html = parsed.html;
      } catch (err) {
        return callback(err);
      }

      // We have to compute the dependencies before
      // passing the contents to the plugins because
      // the image cache plugin replaces local URLs with
      // remove URLs and this will prevent the dependency
      // module from determining which other files in the blog's
      // folder this file depends on.
      try {
        parsed = Dependencies(path, html, metadata);
        dependencies = parsed.dependencies;
        metadata = parsed.metadata;
        html = parsed.html;
      } catch (err) {
        return callback(err);
      }

      debug('Blog:', blog.id, path, "running through plugins");

      // We pass the contents to the plugins for
      // this blog. The resulting HTML is now ready.
      Plugins(blog, path, html, function(err, html) {

        debug('Blog:', blog.id, path, "finished plugins");

        if (err) return callback(err);

        html = fixMustache(html);

        return callback(null, html, metadata, stat, dependencies);
      });
    });
  }, function(err){
    callback(err || cannotConvert(path));
  });
};

function fixMustache(str) {
  return str.split("{{&gt;").join("{{>");
}

function cannotConvert(path) {
  return new Error("Cannot turn this path into an entry: " + path);
}
