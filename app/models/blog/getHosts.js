var client = require("client");
var helper = require("helper");
var ensure = helper.ensure;
var key = require("./key");
var getAllIDs = require("./getAllIDs");

var HOST = require("config").host;

// returns list of pairs [host, blogID]

module.exports = function getHosts(callback) {
  ensure(callback, "function");

  getAllIDs(function(err, ids) {
    if (err) throw err;

    var multi = client.multi();

    for (var i = 0; i < ids.length; i++)
      multi.hmget(key.info(ids[i]), "domain", "handle");

    // This is a very expensive call.
    // We could easily do some work to make this quicker
    // However, it's only going to be invoked when a user
    // changes their username / custom domain.
    multi.exec(function(err, res) {
      if (err) throw err;

      var hosts = [];

      res.forEach(function(keys, i) {
        if (keys && keys[0]) hosts.push([keys[0], ids[i]]);
        if (keys && keys[1]) hosts.push([keys[1] + "." + HOST, ids[i]]);
      });

      return callback(null, hosts);
    });
  });
};
