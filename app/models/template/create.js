var debug = require("debug")("blot:template:create");
var helper = require("helper");
var extend = helper.extend;
var ensure = helper.ensure;
var key = require("./key");
var client = require("client");
var get = require("./get");
var view = require("./view");
var model = require("./model");
var makeID = require("./util/makeID");
var serialize = require("./util/serialize");
var async = require("async");

// Used to create templates for blogs, or for Blot. Templates
// for Blot have the special blogID 'SITE'. I know this is inelegant.
// Name is specific by the user and is shown the dashboard. The preview
// subdomain and URL slug for this template is generated from it.
module.exports = function create(blogID, name, metadata, callback) {
  var templateID, slug, multi;

  debug(blogID, name, metadata);

  try {
    // Name is the name of the template. It's shown on the dashboard
    // and it can contain case. Its case is preserved.
    name = name.trim().slice(0, 100);

    // Slug cannot contain a slash, or it messes up the routing middleware.
    slug = helper.makeSlug(name.split("/").join("-"));

    // makeID and makeSlug do strange things, encoding, decoding, case
    // modification and more. In future, they should be made simpler.
    templateID = makeID(blogID, slug);
  } catch (err) {
    return callback(err);
  }

  // We make sure there is not existing template with this ID
  client.exists(key.metadata(templateID), function(err, stat) {
    if (err) return callback(err);

    if (stat) {
      err = new Error(name + " already exists");
      err.code = "EEXISTS";
      return callback(err);
    }

    // Most of the time, a user will be cloning one of Blot's templates
    // on the dashboard. cloneFrom is the ID of the template they clone.
    // We pass an empty string when running the script to build the
    // global templates.
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
        metadata.isPublic = metadata.owner === "SITE";

        ensure(metadata, model, true);

        multi = client.multi();
        multi.sadd(key.blogTemplates(blogID), templateID);
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
