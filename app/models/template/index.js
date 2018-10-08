var async = require("async");
var redis = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var extend = helper.extend;
var siteOwner = "SITE";

var model = require("./model");
var key = require("./key");
var parse = require("./parse");
var getView = require("./getView");
var serialize = require("./serialize");
var setView = require("./setView");
var isOwner = require("./isOwner");
var makeID = require("./makeID");
var getAllViews = require('./getAllViews');
var getMetadata = require('./getMetadata');

var defaultTemplate = makeID(siteOwner, "default");

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
}

function update(owner, name, metadata, callback) {
  ensure(owner, "string")
    .and(name, "string")
    .and(metadata, "object")
    .and(callback, "function");

  var id = makeID(owner, name);

  if (metadata.isPublic) {
    redis.sadd(key.publicTemplates(), id);
  } else {
    redis.srem(key.publicTemplates(), id);
  }

  return setMetadata(id, metadata, callback);
}

function getViewByURL(templateID, url, callback) {
  ensure(templateID, "string")
    .and(url, "string")
    .and(callback, "function");

  url = helper.urlNormalizer(url);

  redis.get(key.url(templateID, url), callback);
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

    metadata = serialize(metadata, model.metadata);

    if (metadata.isPublic) {
      redis.sadd(key.publicTemplates(), id);
    } else {
      redis.srem(key.publicTemplates(), id);
    }

    redis.sadd(key.blogTemplates(metadata.owner), id, function(err) {
      if (err) throw err;

      redis.hmset(key.metadata(id), metadata, function(err) {
        if (err) throw err;

        return callback(err, changes);
      });
    });
  });
}

function dropView(templateID, viewName, callback) {
  ensure(templateID, "string")
    .and(viewName, "string")
    .and(callback, "function");

  redis.del(key.view(templateID, viewName), function(err) {
    if (err) throw err;

    redis.srem(key.allViews(templateID), viewName, function(err) {
      if (err) throw err;

      callback();
    });
  });
}

function getPartials(blogID, templateID, partials, callback) {
  ensure(blogID, "string")
    .and(templateID, "string")
    .and(partials, "object")
    .and(callback, "function");

  var Entry = require("./entry");
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
        if (allPartials[partial] !== null && allPartials[partial] !== undefined)
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


// The list of possible template choices
// for a given blog. Accepts a UID and
// returns an array of template metadata
// objects. Does not contain any view info
function getTemplateList(blogID, callback) {
  ensure(blogID, "string").and(callback, "function");

  redis.smembers(key.publicTemplates(), function(err, publicTemplates) {
    redis.smembers(key.blogTemplates(blogID), function(err, blogTemplates) {
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

    redis.srem(key.blogTemplates(owner), templateID, function(err) {
      if (err) throw err;

      redis.srem(key.publicTemplates(), templateID, function(err) {
        if (err) throw err;

        redis.del(key.metadata(templateID));
        redis.del(key.allViews(templateID));

        // console.log('DEL: ' + key.metadata(templateID));
        // console.log('DEL: ' + key.allViews(templateID));
        // console.log('DEL: ' + partialsKey(templateID));

        for (var i in views) {
          // console.log('DEL: ' + key.view(templateID, views[i].name));
          redis.del(key.view(templateID, views[i].name));
        }

        callback(null, "Deleted " + templateID);
      });
    });
  });
}

// This method is used to retrieve the locals,
// partials and missing locals for a given view.
// this is what we need to re-implement from disk...
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

module.exports = {
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

  parse: parse,
  readFromFolder: require("./readFromFolder"),
  writeToFolder: require("./writeToFolder"),
  updateFromFolder: require("./updateFromFolder"),
  slug: require("./slug"),

  makeID: makeID,
  isOwner: isOwner,
  siteOwner: siteOwner,
  defaultTemplate: defaultTemplate,

  viewModel: model.view,
  metadataModel: model.metadata
};
