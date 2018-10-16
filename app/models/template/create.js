var helper = require("helper");
var async = require("async");
var extend = helper.extend;
var ensure = helper.ensure;
var key = require("./key");
var client = require("client");
var set = require("./view/set");
var get = require("./get");
var getAll = require("./view/getAll");
var model = require("./model");
var debug = require("debug")("template:create");
var makeID = require("./util/makeID");
var serialize = require("./util/serialize");

// blogID represents the id of a blog who controls the template
// or the string 'SITE' which represents a BLOT template not
// not editable by any blog
module.exports = function create(blogID, name, metadata, callback) {
  var id, slug, multi, metadataString;

  try {
    // Name is user input, it needs to be trimmed
    name = name.trim().slice(0, 100);

    // The slug cannot contain a slash, or it messes up the routing middleware.
    slug = helper.makeSlug(name.split("/").join("-"));

    // Each template has an ID which is namespaced under its blogID
    id = makeID(blogID, slug);
  } catch (err) {
    return callback(err);
  }
  // Don't overwrite an existing template
  client.exists(key.metadata(id), function(err, stat) {
    if (err) return callback(err);

    if (stat) return callback(new Error("Existing template " + name));

    get(metadata.cloneFrom, function(err, existingMetadata) {
      if (err) return callback(err);

      if (!existingMetadata && metadata.cloneFrom !== undefined)
        return callback(new Error(metadata.cloneFrom + " does not exist"));

      // Copy across any metadata from the
      // source of the clone, if its not set
      if (existingMetadata) {
        debug("Cloning data", metadata, existingMetadata);
        extend(metadata).and(existingMetadata);
      }

      // Defaults
      metadata.id = id;
      metadata.name = name;
      metadata.owner = blogID;
      metadata.slug = slug;
      metadata.locals = metadata.locals || {};
      metadata.description = metadata.description || "";
      metadata.thumb = metadata.thumb || "";
      metadata.localEditing = false;
      metadata.cloneFrom = metadata.cloneFrom || "";
      metadata.isPublic = metadata.isPublic || false;

      multi = client.multi();

      multi.sadd(key.blogTemplates(blogID), id);

      if (metadata.isPublic) {
        multi.sadd(key.publicTemplates, id);
      } else {
        multi.srem(key.publicTemplates, id);
      }

      ensure(metadata, model, true);

      multi.sadd(key.blogTemplates(metadata.owner), id);

      metadataString = serialize(metadata, model);

      multi.hmset(key.metadata(id), metadataString);
      debug("Saving", metadata);
      multi.exec(function(err) {
        if (err) return callback(err);

        getAll(metadata.cloneFrom, function(err, allViews) {
          if (err) return callback(err);

          async.each(allViews, set.bind(null, name), function(err) {
            if (err) return callback(err);
            callback(null, metadata);
          });
        });
      });
    });
  });
};
