var helper = require("helper");
var extend = helper.extend;
var ensure = helper.ensure;
var key = require("./key");
var client = require("client");
var get = require("./get");
var view = require("./view");
var model = require("./model");
var debug = require("debug")("template:create");
var makeID = require("./util/makeID");
var serialize = require("./util/serialize");
var async = require("async");
// blogID represents the id of a blog who controls the template
// or the string 'SITE' which represents a BLOT template not
// not editable by any blog
module.exports = function create(blogID, name, metadata, callback) {
  var templateID, slug, multi;

  try {
    // Name is user input, it needs to be trimmed
    name = name.trim().slice(0, 100);

    // The slug cannot contain a slash, or it messes up the routing middleware.
    slug = helper.makeSlug(name.split("/").join("-"));

    // Each template has an ID which is namespaced under its blogID
    templateID = makeID(blogID, slug);
  } catch (err) {
    return callback(err);
  }

  client.exists(key.metadata(templateID), function(err, stat) {
    if (err) return callback(err);

    // Don't overwrite an existing template
    if (stat) {
      err = new Error(name + " already exists");
      err.code = "EEXISTS";
      return callback(err);
    }

    get(metadata.cloneFrom, function(err, existingMetadata) {
      if (err) return callback(err);

      // Return an error if the template the user would like to
      // clone does not exist.
      if (!existingMetadata && metadata.cloneFrom !== undefined) {
        err = new Error(metadata.cloneFrom + " does not exist");
        err.code = "ENOENT";
        return callback(err);
      }

      // Copy across any metadata from the template to clone
      if (existingMetadata) {
        debug("Cloning data", metadata, existingMetadata);
        extend(metadata).and(existingMetadata);
      }

      try {
        // Defaults
        metadata.id = templateID;
        metadata.name = name;
        metadata.owner = blogID;
        metadata.slug = slug;
        metadata.locals = metadata.locals || {};
        metadata.description = metadata.description || "";
        metadata.thumb = metadata.thumb || "";
        metadata.localEditing = false;
        metadata.cloneFrom = metadata.cloneFrom || "";
        metadata.isPublic = metadata.isPublic || false;

        ensure(metadata, model, true);

        multi = client.multi();
        multi.sadd(key.blogTemplates(blogID), templateID);
        multi.sadd(key.blogTemplates(metadata.owner), templateID);
        multi.hmset(key.metadata(templateID), serialize(metadata, model));

        if (metadata.isPublic) multi.sadd(key.publicTemplates, templateID);
      } catch (err) {
        return callback(err);
      }

      multi.exec(function(err) {
        if (err) return callback(err);

        // Transfer any and all views from the template
        // the user would like to clone, if relevant
        view.getAll(metadata.cloneFrom, function(err, views) {
          if (err) return callback(err);
          async.each(views, view.set.bind(null, templateID), function(err) {
            if (err) return callback(err);
            callback(null, metadata);
          });
        });
      });
    });
  });
};
