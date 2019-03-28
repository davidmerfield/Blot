module.exports = (function() {
  var Mustache = require("mustache");
  var async = require('async');
  var redis = require('client'),
    helper = require('helper'),
    ensure = helper.ensure,
    type = helper.type,
    extend = helper.extend,
    _ = require("lodash"),
    siteOwner = "SITE",
    defaultTemplate = makeID(siteOwner, "default"),
    metadataModel = {
      id: "string",
      name: "string",
      slug: "string",
      owner: "string",
      cloneFrom: "string",
      isPublic: "boolean",
      description: "string",
      localEditing: "boolean",
      thumb: "string",
      locals: "object"
    },
    viewModel = {
      name: "string",
      content: "string",
      type: "string",
      partials: "object",
      locals: "object",
      retrieve: "object",
      url: "string"
    };

  // Associates a theme with a UID owner
  // and an existing theme to clone if possible
  function create(owner, name, metadata, callback) {
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

    ensure(metadata, metadataModel);

    redis.exists(metadataKey(id), function(err, stat) {
      if (err) throw err;

      // Don't overwrite an existing template
      if (stat) {
        err = new Error("A template called " + name + " name already exists");
        err.code = 'EEXISTS';
        return callback(err);
      }

      redis.sadd(blogTemplatesKey(owner), id, function(err) {
        if (err) throw err;

        if (metadata.isPublic) {
          redis.sadd(publicTemplatesKey(), id, then);
        } else {
          redis.srem(publicTemplatesKey(), id, then);
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
  }

  function update(owner, name, metadata, callback) {
    ensure(owner, "string")
      .and(name, "string")
      .and(metadata, "object")
      .and(callback, "function");

    var id = makeID(owner, name);

    if (metadata.isPublic) {
      redis.sadd(publicTemplatesKey(), id);
    } else {
      redis.srem(publicTemplatesKey(), id);
    }

    return setMetadata(id, metadata, callback);
  }

  function getViewByURL(templateID, url, callback) {
    ensure(templateID, "string")
      .and(url, "string")
      .and(callback, "function");

    url = helper.urlNormalizer(url);

    redis.get(urlKey(templateID, url), callback);
  }

  function getMetadata(id, callback) {
    ensure(id, "string").and(callback, "function");

    redis.hgetall(metadataKey(id), function(err, metadata) {
      if (err) return callback(err);

      metadata = deserialize(metadata, metadataModel);

      return callback(null, metadata);
    });
  }

  function setMetadata(id, updates, callback) {
    ensure(id, "string")
      .and(updates, "object")
      .and(callback, "function");

    getMetadata(id, function(err, metadata) {
      var changes;

      metadata = metadata || {};

      for (var i in updates) {
        if (metadata[i] !== updates[i]) changes = true;
        metadata[i] = updates[i];
      }

      metadata = serialize(metadata, metadataModel);

      if (metadata.isPublic) {
        redis.sadd(publicTemplatesKey(), id);
      } else {
        redis.srem(publicTemplatesKey(), id);
      }

      redis.sadd(blogTemplatesKey(metadata.owner), id, function(err) {
        if (err) throw err;

        redis.hmset(metadataKey(id), metadata, function(err) {
          if (err) throw err;

          return callback(err, changes);
        });
      });
    });
  }

  function getView(name, viewName, callback) {
    ensure(name, "string")
      .and(viewName, "string")
      .and(callback, "function");

    redis.hgetall(viewKey(name, viewName), function(err, view) {
      if (!view) {
        var message = "No view called " + viewName;
        return callback(new Error(message));
      }

      view = deserialize(view, viewModel);

      callback(err, view);
    });
  }

  function dropView(templateID, viewName, callback) {
    ensure(templateID, "string")
      .and(viewName, "string")
      .and(callback, "function");

    redis.del(viewKey(templateID, viewName), function(err) {
      if (err) throw err;

      redis.srem(allViewsKey(templateID), viewName, function(err) {
        if (err) throw err;

        callback();
      });
    });
  }

  function setView(templateID, updates, callback) {
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

    var templateKey = metadataKey(templateID);
    var allViews = allViewsKey(templateID);
    var key = viewKey(templateID, name);

    redis.exists(templateKey, function(err, stat) {
      if (err) return callback(err);

      if (!stat)
        return callback(new Error("There is no template called " + templateID));

      redis.sadd(allViews, name, function(err) {
        if (err) return callback(err);

        // Look up previous state of view if applicable
        getView(templateID, name, function(err, view) {
          // This will error if no view exists
          // we ust this method to create a view
          // to so dont use this error...
          // if (err) return callback(err);

          view = view || {};

          if (updates.url && updates.url !== view.url) {
            redis.del(urlKey(templateID, view.url));
            redis.set(urlKey(templateID, updates.url), name);
          }

          for (var i in updates) view[i] = updates[i];

          view.locals = view.locals || {};
          view.retrieve = view.retrieve || {};
          view.partials = view.partials || {};

          view.url = helper.urlNormalizer(view.url || "");

          var parseResult = helper.parseTemplate(view.content);

          // TO DO REMOVE THIS
          if (type(view.partials, "array")) {
            var _partials = {};

            for (var i = 0; i < view.partials.length; i++)
              _partials[view.partials[i]] = null;

            view.partials = _partials;
          }

          extend(view.partials).and(parseResult.partials);

          view.retrieve = parseResult.retrieve || [];

          view = serialize(view, viewModel);

          redis.hmset(key, view, function(err) {
            if (err) throw err;

            callback();
          });
        });
      });
    });
  }

  function getPartials(blogID, templateID, partials, callback) {
    
    try {
      ensure(blogID, "string")
        .and(templateID, "string")
        .and(partials, "object")
        .and(callback, "function");      
    } catch (e) {
      return callback(e);
    }

    var Entry = require("../entry");
    var allPartials = {};
    var retrieve = {};

    for (var i in partials) if (partials[i]) allPartials[i] = partials[i];

    fetchList(partials, function() {
      return callback(null, allPartials, retrieve);
    });

    function fetchList(partials, done) {
      async.eachOfSeries(
        partials,
        function(value, partial, next) {
          // Don't fetch a partial if we've got it already.
          // Partials which returned nothing are set as
          // empty strings to prevent any infinities.
          if (
            allPartials[partial] !== null &&
            allPartials[partial] !== undefined
          )
            return next();

          // If the partial's name starts with a slash,
          // it is a path to an entry.
          if (partial.charAt(0) === "/") {
            Entry.get(blogID, partial, function(entry) {
              // empty string and not undefined to
              // prevent infinite fetches
              allPartials[partial] = "";

              if (!entry || !entry.html) return next();

              // Only allow access to entries which exist and are public
              if (!entry.deleted && !entry.draft && !entry.scheduled)
                allPartials[partial] = entry.html;

              next();
            });
          }

          // If the partial's name doesn't start with a slash,
          // it is the name of a tempalte view.
          if (partial.charAt(0) !== "/") {
            getView(templateID, partial, function(err, view) {
              if (view) {
                allPartials[partial] = view.content;

                for (var i in view.retrieve) retrieve[i] = view.retrieve[i];

                fetchList(view.partials, next);
              } else {
                allPartials[partial] = "";
                next();
              }
            });
          }
        },
        done
      );
    }
  }

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

  function getAllViews(name, callback) {
    ensure(name, "string").and(callback, "function");

    redis.smembers(allViewsKey(name), function(err, viewNames) {
      getMultipleViews(name, viewNames, function(err, views) {
        getMetadata(name, function(err, metadata) {
          callback(err, views, metadata);
        });
      });
    });
  }

  function getMultipleViews(templateName, viewNames, callback) {
    ensure(templateName, "string")
      .and(viewNames, "array")
      .and(callback, "function");

    var totalViews = viewNames.length,
      views = {},
      error;

    if (!totalViews) onFinish();

    for (var i in viewNames) getView(templateName, viewNames[i], onGet);

    function onGet(err, view) {
      error = err;
      // TO DO collect missing
      // partials or views and expose
      // them to the callback. Right now
      // nothing happens.
      // if (err) console.log(err);
      if (view && view.name) views[view.name] = view;
      if (!--totalViews) onFinish();
    }

    function onFinish() {
      // We don't pass errors
      // since we don't care
      // if one of the partials does
      // not exist.
      callback(null, views);
    }
  }

  // The list of possible template choices
  // for a given blog. Accepts a UID and
  // returns an array of template metadata
  // objects. Does not contain any view info
  function getTemplateList(blogID, callback) {
    ensure(blogID, "string").and(callback, "function");

    redis.smembers(publicTemplatesKey(), function(err, publicTemplates) {
      redis.smembers(blogTemplatesKey(blogID), function(err, blogTemplates) {
        var templateIDs = publicTemplates.concat(blogTemplates);
        var response = [];

        async.eachSeries(
          templateIDs,
          function(id, next) {
            getMetadata(id, function(err, info) {
              if (err) return next();

              if (info) response.push(info);

              next();
            });
          },
          function() {
            callback(err, response);
          }
        );
      });
    });
  }

  function isOwner(owner, id, callback) {
    ensure(owner, "string").and(id, "string");

    redis.SISMEMBER(blogTemplatesKey(owner), id, callback);
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

  function drop(owner, templateName, callback) {
    var templateID = makeID(owner, templateName);

    ensure(owner, "string")
      .and(templateID, "string")
      .and(callback, "function");

    getAllViews(templateID, function(err, views) {
      if (err || !views) return callback(err || "No views");

      redis.srem(blogTemplatesKey(owner), templateID, function(err) {
        if (err) throw err;

        redis.srem(publicTemplatesKey(), templateID, function(err) {
          if (err) throw err;

          redis.del(metadataKey(templateID));
          redis.del(allViewsKey(templateID));

          // console.log('DEL: ' + metadataKey(templateID));
          // console.log('DEL: ' + allViewsKey(templateID));
          // console.log('DEL: ' + partialsKey(templateID));

          for (var i in views) {
            // console.log('DEL: ' + viewKey(templateID, views[i].name));
            redis.del(viewKey(templateID, views[i].name));
          }

          callback(null, "Deleted " + templateID);
        });
      });
    });
  }

  function metadataKey(name) {
    return "template:" + name + ":info";
  }

  function viewKey(name, viewName) {
    return "template:" + name + ":view:" + viewName;
  }

  function urlKey(templateID, url) {
    return "template:" + templateID + ":url:" + url;
  }

  function allViewsKey(name) {
    return "template:" + name + ":all_views";
  }

  function publicTemplatesKey() {
    return "template:public_templates";
  }

  function blogTemplatesKey(blogID) {
    return "template:owned_by:" + blogID;
  }

  function makeID(owner, name) {
    return owner + ":" + helper.makeSlug(name);
  }

  function serialize(sourceObj, model) {
    ensure(sourceObj, model);

    // We don't want to modify the
    // obj passed in case we use it
    // elsewhere in future
    var obj = _.cloneDeep(sourceObj);

    for (var i in obj) {
      if (model[i] === "object" || model[i] === "array") {
        obj[i] = JSON.stringify(obj[i]);
      }
    }

    return obj;
  }

  function deserialize(sourceObj, model) {
    // We don't want to modify the
    // obj passed in case we use it
    // elsewhere in future
    var obj = _.cloneDeep(sourceObj);

    for (var i in obj) {
      if (model[i] === "object" || model[i] === "array")
        obj[i] = JSON.parse(obj[i]);

      if (model[i] === "boolean") obj[i] = obj[i] === "true";
    }

    // ensure(obj, model);

    return obj;
  }

  // This method is used to retrieve the locals,
  // partials and missing locals for a given view.
  function getFullView(blogID, templateID, viewName, callback) {
    ensure(blogID, "string")
      .and(templateID, "string")
      .and(viewName, "string")
      .and(callback, "function");

    getView(templateID, viewName, function(err, view) {
      if (err || !view) return callback(err);

      // View has:

      // - content (string) of the template view
      // - retrieve (object) locals embedded in the view
      //                     which need to be fetched.
      // - partials (object) partials in view

      getPartials(blogID, templateID, view.partials, function(
        err,
        allPartials,
        retrieveFromPartials
      ) {
        if (err) return callback(err);

        // allPartials (object) viewname : viewcontent

        // Now we've fetched the partials we need to
        // append the missing locals in the partials...
        extend(view.retrieve).and(retrieveFromPartials);

        var response = [
          view.locals,
          allPartials,
          view.retrieve,
          view.type,
          view.content
        ];

        return callback(null, response);
      });
    });
  }

  return {
    create: create,
    update: update,
    getMetadata: getMetadata,
    setMetadata: setMetadata,

    getFullView: getFullView,
    getView: getView,
    getViewByURL: getViewByURL,
    setView: setView,
    dropView: dropView,
    getPartials: getPartials,
    getAllViews: getAllViews,
    getTemplateList: getTemplateList,

    drop: drop,

    makeID: makeID,
    isOwner: isOwner,
    siteOwner: siteOwner,
    defaultTemplate: defaultTemplate,

    viewModel: viewModel,
    metadataModel: metadataModel
  };
})();
