var clone = require("./clone");
var ensure = require("helper").ensure;
var helper = require("helper");
var makeID = require("./util/makeID");
var client = require("client");
var key = require("./key");
var metadataModel = require("./metadataModel");
var setMetadata = require("./setMetadata");

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
  metadata.localEditing = metadata.localEditing === true;

  ensure(metadata, metadataModel);

  client.exists(key.metadata(id), function(err, stat) {
    if (err) throw err;

    // Don't overwrite an existing template
    if (stat) {
      err = new Error("A template called " + name + " name already exists");
      err.code = "EEXISTS";
      return callback(err);
    }

    client.sadd(key.blogTemplates(owner), id, function(err) {
      if (err) throw err;

      if (metadata.isPublic) {
        client.sadd(key.publicTemplates(), id, then);
      } else {
        client.srem(key.publicTemplates(), id, then);
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
