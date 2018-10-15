var key = require("./key");
var _ = require("lodash");
var helper = require("helper");
var ensure = helper.ensure;
var TYPE = require("./scheme").TYPE;
var validate = require("./validate");
var get = require("./get");
var serial = require("./serial");
var flushCache = require("./flushCache");
var client = require("client");

function Changes(latest, former) {
  var changes = {};

  // Determine any changes to the user's info
  for (var i in latest)
    if (!_.isEqual(latest[i], former[i])) changes[i] = latest[i] = latest[i];

  return changes;
}

module.exports = function(blogID, blog, callback) {
  ensure(blogID, "string").and(callback, "function");

  var multi = client.multi();
  var formerBackupDomain, backupDomain;

  validate(blogID, blog, function(errors, latest) {
    if (errors) return callback(errors);

    get({ id: blogID }, function(err, former) {
      former = former || {};

      if (err) return callback(err);

      var changes = Changes(latest, former);

      if (changes.handle) {
        multi.set(key.handle(latest.handle), blogID);
      }

      // We check against empty string, because if the
      // user removes their domain from the page on the
      // dashboard, changes.domain will be an empty string
      if (changes.domain || changes.domain === "") {
        // We calculate a backup domain to check against
        // Lots of users have difficulty understanding the
        // difference between www.example.com and example.com
        // So we try and help them catch mistakes. This additional
        // backup domain means that when the user types in
        // example.com, but configures a CNAME record for www.example.com
        // then www.example.com will work. It also means that when
        // the user types in example.com, sets up an A or ALIAS record
        // then visits www.example.com, the domain will redirect.
        // I'm not sure if this is 'right' or 'correct' but it reduces
        // a good deal of frustration and confusion on the part of
        // Blot's customers. So it will remain for now.
        if (former.domain) {
          formerBackupDomain =
            former.domain.indexOf("www.") === -1
              ? "www." + former.domain
              : former.domain.slice("www.".length);
          multi.del(key.domain(former.domain));
          multi.del(key.domain(formerBackupDomain));
        }

        // Order is important, we must append the delete
        // actions to the multi command before the set
        // to ensure that when the user changes the domain
        // from www.example.com to example.com on the dashboard
        // we don't accidentally delete the new settings.
        if (latest.domain) {
          backupDomain =
            latest.domain.indexOf("www.") === -1
              ? "www." + latest.domain
              : latest.domain.slice("www.".length);
          multi.set(key.domain(latest.domain), blogID);
          multi.set(key.domain(backupDomain), blogID);
        }
      }

      // Check if we need to change user's css or js cache id
      if (changes.template || changes.plugins) {
        latest.cacheID = Date.now();
        latest.cssURL = "/style.css?" + latest.cacheID;
        latest.scriptURL = "/script.js?" + latest.cacheID;
        changes.cacheID = true;
        changes.cssURL = true;
        changes.scriptURL = true;
      }

      // Verify that all the new info matches
      // strictly the type specification
      ensure(latest, TYPE);

      var changesList = _.keys(changes);

      multi.hmset(key.info(blogID), serial(latest));

      multi.exec(function(err) {
        if (err) return callback(err);

        flushCache(blogID, function(err) {
          if (err) return callback(err);

          callback(errors, changesList);
        });
      });
    });
  });
};
