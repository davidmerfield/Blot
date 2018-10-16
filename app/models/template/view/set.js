var helper = require("helper");
var ensure = helper.ensure;
var type = helper.type;
var extend = helper.extend;
var redis = require("client");
var Mustache = require("mustache");
var parse = require("./parse");
var key = require("./key");

var get = require("./get");
var serialize = require("../util/serialize");
var model = require("./model");

module.exports = function set(templateID, updates, callback) {
  if (updates.partials !== undefined && type(updates.partials) !== "object") {
    updates.partials = {};
    console.log(templateID, updates, "Partials are wrong type");
  }

  ensure(templateID, "string")
    .and(updates, model)
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

  // if (!stat)
  //   return callback(new Error("There is no template called " + templateID));

  redis.sadd(allViews, name, function(err) {
    if (err) return callback(err);

    // Look up previous state of view if applicable
    get(templateID, name, function(err, view) {
      // This will error if no view exists
      // we ust this method to create a view
      // to so dont use this error...
      // if (err) return callback(err);

      view = view || {};

      if (updates.url && updates.url !== view.url) {
        redis.del(key.url(templateID, view.url));
        redis.set(key.url(templateID, updates.url), name);
      }

      for (var i in updates) view[i] = updates[i];

      view.locals = view.locals || {};
      view.retrieve = view.retrieve || {};
      view.partials = view.partials || {};

      view.url = helper.urlNormalizer(view.url || "");

      var parseResult = parse(view.content);

      // TO DO REMOVE THIS
      if (type(view.partials, "array")) {
        var _partials = {};

        for (var i = 0; i < view.partials.length; i++)
          _partials[view.partials[i]] = null;

        view.partials = _partials;
      }

      extend(view.partials).and(parseResult.partials);

      view.retrieve = parseResult.retrieve || [];

      view = serialize(view, model);

      redis.hmset(viewKey, view, function(err) {
        if (err) throw err;

        callback();
      });
    });
  });
};
