var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var redis = require("client");
var makeID = require("./makeID");
var getAllViews = require("./getAllViews");

module.exports = function drop(owner, templateName, callback) {
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
};
