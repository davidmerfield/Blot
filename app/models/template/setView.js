var Mustache = require("mustache");
var helper = require("helper");
var type = helper.type;
var client = require("client");
var key = require("./key");
var ensure = helper.ensure;
var extend = helper.extend;
var viewModel = require("./viewModel");
var getView = require("./getView");
var serialize = require("./util/serialize");
var getMetadata = require("./getMetadata");
var Blog = require("blog");

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
  var routesKey = key.routes(templateID);

  getMetadata(templateID, function(err, metadata) {
    if (err) return callback(err);

    if (!metadata)
      return callback(new Error("There is no template called " + templateID));

    client.sadd(allViews, name, function(err) {
      if (err) return callback(err);

      // Look up previous state of view if applicable
      getView(templateID, name, function(err, view) {
        // This will error if no view exists
        // we ust this method to create a view
        // to so dont use this error...
        // if (err) return callback(err);

        view = view || {};

        if (updates.url && updates.url !== view.url) {
          client.del(key.url(templateID, view.url));
          client.set(key.url(templateID, updates.url), name);
        }

        for (let i in updates) view[i] = updates[i];

        view.locals = view.locals || {};
        view.retrieve = view.retrieve || {};
        view.partials = view.partials || {};

        view.url = helper.urlNormalizer(view.url || "");

        var parseResult = helper.parseTemplate(view.content);

        // TO DO REMOVE THIS
        if (type(view.partials, "array")) {
          var _partials = {};

          for (let i = 0; i < view.partials.length; i++)
            _partials[view.partials[i]] = null;

          view.partials = _partials;
        }

        extend(view.partials).and(parseResult.partials);

        view.retrieve = parseResult.retrieve || [];

        view.routes = view.routes || [];

        if (view.routes.length) {
          let routes = {};

          view.routes.forEach(route => {
            routes[route] = view.name;
          });

          client.hmset(routesKey, routes, function(err) {
            if (err) console.log(err);
          });
        }

        view = serialize(view, viewModel);

        client.hmset(viewKey, view, function(err) {
          if (err) return callback(err);

          Blog.set(metadata.owner, { cacheID: Date.now() }, function(err) {
            callback(err);
          });
        });
      });
    });
  });
};
