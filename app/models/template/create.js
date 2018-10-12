var helper = require("helper");
var async = require("async");
var extend = helper.extend;
var key = require("./key");
var redis = require("client");
var makeID = require("./makeID");
var setView = require("./setView");
var getMetadata = require("./getMetadata");
var getAllViews = require("./getAllViews");
var setMetadata = require("./setMetadata");

// blogID represents the id of a blog who controls the template
// or the string 'SITE' which represents a BLOT template not
// not editable by any blog
module.exports = function create(blogID, name, metadata, callback) {
  var id, slug, multi;

  // Name is user input, it needs to be trimmed
  name = name.trim().slice(0, 100);

  // The slug cannot contain a slash, or it messes up the routing middleware.
  slug = helper.makeSlug(name.split("/").join("-"));

  // Each template has an ID which is namespaced under its blogID
  id = makeID(blogID, slug);

  // Defaults
  metadata.id = id;
  metadata.name = name;
  metadata.owner = blogID;
  metadata.slug = slug;
  metadata.locals = metadata.locals || {};
  metadata.description = metadata.description || "";
  metadata.thumb = metadata.thumb || "";
  metadata.localEditing = false;

  // Don't overwrite an existing template
  redis.exists(key.metadata(id), function(err, stat) {
    if (err) throw err;

    if (stat) {
      err = new Error("There is already a template called " + name);
      return callback(err);
    }

    multi = redis.multi();

    multi.sadd(key.blogTemplates(blogID), id);

    if (metadata.isPublic) {
      multi.sadd(key.publicTemplates(), id);
    } else {
      multi.srem(key.publicTemplates(), id);
    }

    multi.exec(function(err) {
      if (err) return callback(err);

      setMetadata(id, metadata, function(err) {
        if (err) return callback(err);

        if (!metadata.cloneFrom) return callback(null);

        getAllViews(metadata.cloneFrom, function(err, allViews) {
          if (err || !allViews) {
            var message =
              "No theme with that name exists to clone from " +
              metadata.cloneFrom;
            return callback(new Error(message));
          }

          async.each(
            allViews,
            function(view, next) {
              setView(name, view, next);
            },
            function(err) {
              if (err) return callback(err);

              getMetadata(metadata.cloneFrom, function(err, existingMetadata) {
                if (err) {
                  var message = "Could not clone from " + metadata.cloneFrom;
                  return callback(new Error(message));
                }

                // Copy across any metadata from the
                // source of the clone, if its not set
                extend(metadata).and(existingMetadata);

                return setMetadata(id, metadata, callback);
              });
            }
          );
        });
      });
    });
  });
};
