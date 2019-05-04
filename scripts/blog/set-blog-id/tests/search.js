var client = require("client");
var keys = require("../../../redis/keys");
var async = require("async");
var colors = require("colors/safe");

if (require.main === module) {
  var searchTerm = process.argv[2];

  if (!searchTerm) throw new Error("Please pass search query as first arg");

  main(searchTerm, function(err, res) {
    if (err) throw err;
    res.map(function(item) {
      var val = item.value;
      var key = item.key;
      var res = colors.dim(item.type) + " " + key;

      val = val.split(searchTerm).join(colors.white(searchTerm));
      res += " " + colors.dim(val);
      console.log(res);
    });
    process.exit();
  });
}

function main(string, callback) {
  var types = {};
  var result = [];

  keys("*", function(err, keys) {
    if (err) return callback(err);

    async.each(
      keys,
      function(key, next) {
        if (key.indexOf(string) > -1)
          result.push({ key: key, value: "KEY ITSELF", type: "KEY" });

        client.type(key, function(err, type) {
          if (err) return next(err);

          types[type] = types[type] || [];
          types[type].push(key);

          next();
        });
      },
      function(err) {
        if (err) return callback(err);

        async.eachOf(
          types,
          function(keys, type, next) {
            if (type === "string") {
              stringSearch(string, keys, result, next);
            } else if (type === "hash") {
              hashSearch(string, keys, result, next);
            } else if (type === "set") {
              setSearch(string, keys, result, next);
            } else {
              next(new Error("No handlers for strings of type: " + type));
            }
          },
          function(err) {
            if (err) return callback(err);
            callback(null, result);
          }
        );
      }
    );
  });
}

function stringSearch(string, keys, result, callback) {
  async.each(
    keys,
    function(key, next) {
      client.get(key, function(err, value) {
        if (err) return next(err);
        if (!value) return next();
        if (value.indexOf(string) === -1) return next();

        result.push({ key: key, type: "STRING", value: value });
        next();
      });
    },
    callback
  );
}

function hashSearch(string, keys, result, callback) {
  async.each(
    keys,
    function(key, next) {
      client.hgetall(key, function(err, res) {
        if (err) return next(err);
        if (!res) return next();

        for (var property in res)
          if (
            res[property].indexOf(string) > -1 ||
            property.indexOf(string) > -1
          )
            result.push({
              key: key,
              type: "HASH",
              value: property + " " + res[property]
            });

        next();
      });
    },
    callback
  );
}

function setSearch(string, keys, result, callback) {
  async.each(
    keys,
    function(key, next) {
      client.smembers(key, function(err, members) {
        if (err) return next(err);
        if (!members) return next();

        members.forEach(function(member) {
          if (member.indexOf(string) > -1)
            result.push({ key: key, type: "SET", value: member });
        });

        next();
      });
    },
    callback
  );
}

module.exports = main;
