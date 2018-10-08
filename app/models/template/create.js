var helper = require("helper");
var ensure = helper.ensure;
var extend = helper.extend;
var model = require("./model");
var key = require("./key");
var redis = require("client");
var makeID = require('./makeID');
var setView = require('./setView');
var getMetadata = require('./getMetadata');
var getAllViews = require('./getAllViews');
var setMetadata = require('./setMetadata');

// Associates a theme with a UID owner
// and an existing theme to clone if possible
module.exports = function create(owner, name, metadata, callback) {
  // Owner represents the id of a blog
  // who controls the template
  // or the string 'SITE' which represents
  // a BLOT template not editable by any blog
  // ensure a blogID is always a number, never 'SITE'

  ensure(owner, "string")
    .and(metadata, "object")
    .and(name, "string")
    .and(callback, "function");

  // Name is user input, it needs to be trimmed
  name = name.slice(0, 100);

  // The slug cannot contain a slash, or it messes
  // up the routing middleware.
  var slug = helper.makeSlug(name.split("/").join("-"));

  // Each template has an ID which is namespaced under its owner
  var id = makeID(owner, slug);

  // Defaults
  metadata.id = id;
  metadata.name = name;
  metadata.owner = owner;
  metadata.slug = slug;
  metadata.locals = metadata.locals || {};
  metadata.description = metadata.description || "";
  metadata.thumb = metadata.thumb || "";
  metadata.localEditing = false;

  ensure(metadata, model.metadata);

  redis.exists(key.metadata(id), function(err, stat) {
    if (err) throw err;

    // Don't overwrite an existing template
    if (stat) {
      var message = "A template called " + name + " name already exists";
      return callback(new Error(message));
    }

    redis.sadd(key.blogTemplates(owner), id, function(err) {
      if (err) throw err;

      if (metadata.isPublic) {
        redis.sadd(key.publicTemplates(), id, then);
      } else {
        redis.srem(key.publicTemplates(), id, then);
      }

      function then(err) {
        if (err) throw err;

        setMetadata(id, metadata, function(err) {
          if (err) throw err;

          if (metadata.cloneFrom) {
            clone(metadata.cloneFrom, id, metadata, callback);
          } else {
            callback();
          }
        });
      }
    });
  });
};

function setMultipleViews(name, views, callback) {
  ensure(name, "string")
    .and(views, "object")
    .and(callback, "function");

  var totalViews = 0,
    error;

  for (var i in views) {
    totalViews++;
    setView(name, views[i], onSet);
  }

  if (!totalViews) onFinish();

  function onSet(err) {
    error = err;
    if (!--totalViews) onFinish();
  }

  function onFinish() {
    callback(error);
  }
}

function clone(fromID, toID, metadata, callback) {
  ensure(fromID, "string")
    .and(toID, "string")
    .and(metadata, "object")
    .and(callback, "function");

  getAllViews(fromID, function(err, allViews) {
    if (err || !allViews) {
      var message = "No theme with that name exists to clone from " + fromID;
      return callback(new Error(message));
    }

    setMultipleViews(toID, allViews, function(err) {
      if (err) return callback(err);

      getMetadata(fromID, function(err, existingMetadata) {
        if (err) {
          var message = "Could not clone from " + fromID;
          return callback(new Error(message));
        }

        // Copy across any metadata from the
        // source of the clone, if its not set
        extend(metadata).and(existingMetadata);

        return setMetadata(toID, metadata, callback);
      });
    });
  });
}
