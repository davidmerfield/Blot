var Mustache = require("mustache");
var type = require("helper/type");
var client = require("models/client");
var key = require("./key");
var urlNormalizer = require("helper/urlNormalizer");
var ensure = require("helper/ensure");
var extend = require("helper/extend");
var viewModel = require("./viewModel");
var getView = require("./getView");
var serialize = require("./util/serialize");
var getMetadata = require("./getMetadata");
var Blog = require("models/blog");
var parseTemplate = require("./parseTemplate");

module.exports = function setView(templateID, updates, callback) {
  if (updates.partials !== undefined && type(updates.partials) !== "object") {
    updates.partials = {};
    console.log(templateID, updates, "Partials are wrong type");
  }

  ensure(templateID, "string")
    .and(updates, viewModel)
    .and(callback, "function");

  var name = updates.name;

  if (!name || !type(name, "string")) {
    return callback(new Error("The view's name is invalid"));
  }

  if (updates.content !== undefined) {
    try {
      Mustache.render(updates.content, {});
    } catch (e) {
      return callback(e);
    }
  }

  var allViews = key.allViews(templateID);
  var viewKey = key.view(templateID, name);

  getMetadata(templateID, function (err, metadata) {
    if (err) return callback(err);

    if (!metadata)
      return callback(new Error("There is no template called " + templateID));

    client.sadd(allViews, name, function (err) {
      if (err) return callback(err);

      // Look up previous state of view if applicable
      getView(templateID, name, function (err, view) {
        // This will error if no view exists
        // we use this method to create a view
        // so don't use this error...
        // if (err) return callback(err);

        view = view || {};

        var changes;

        if (updates.url) {
          updates.url = urlNormalizer(updates.url || "");

          client.set(key.url(templateID, updates.url), name);

          if (updates.url !== view.url) {
            client.del(key.url(templateID, view.url));
          }
        }

        // If `urlPatterns` exists, store it in Redis
        if (updates.urlPatterns) {
          const urlPatternsKey = key.urlPatterns(templateID);
          client.hset(urlPatternsKey, name, JSON.stringify(updates.urlPatterns));
        }

        for (var i in updates) {
          if (updates[i] !== view[i]) changes = true;
          view[i] = updates[i];
        }

        view.locals = view.locals || {};
        view.retrieve = view.retrieve || {};
        view.partials = view.partials || {};

        var parseResult = parseTemplate(view.content);

        // TO DO REMOVE THIS
        if (type(view.partials, "array")) {
          var _partials = {};

          for (var i = 0; i < view.partials.length; i++)
            _partials[view.partials[i]] = null;

          view.partials = _partials;
        }

        if (!view.urlPatterns) {
          view.urlPatterns = [view.url];
        }

        extend(view.partials).and(parseResult.partials);

        view.retrieve = parseResult.retrieve || [];

        view = serialize(view, viewModel);

        client.hmset(viewKey, view, function (err) {
          if (err) return callback(err);

          if (!changes) return callback();

          Blog.set(metadata.owner, { cacheID: Date.now() }, function (err) {
            callback(err);
          });
        });
      });
    });
  });
};