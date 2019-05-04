var getAllViews = require('./getAllViews');
var ensure = require('helper').ensure;
var client = require('client');
var key = require('./key');
var makeID = require('./util/makeID');

module.exports = function drop(owner, templateName, callback) {
  var templateID = makeID(owner, templateName);

  ensure(owner, "string")
    .and(templateID, "string")
    .and(callback, "function");

  getAllViews(templateID, function(err, views) {
    if (err || !views) return callback(err || "No views");

    client.srem(key.blogTemplates(owner), templateID, function(err) {
      if (err) throw err;

      client.srem(key.publicTemplates(), templateID, function(err) {
        if (err) throw err;

        client.del(key.metadata(templateID));
        client.del(key.allViews(templateID));

        // console.log('DEL: ' + metadataKey(templateID));
        // console.log('DEL: ' + key.allViews(templateID));
        // console.log('DEL: ' + partialsKey(templateID));

        for (var i in views) {
          // console.log('DEL: ' + key.view(templateID, views[i].name));
          client.del(key.view(templateID, views[i].name));
        }

        callback(null, "Deleted " + templateID);
      });
    });
  });
};
