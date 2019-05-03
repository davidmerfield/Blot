var client = require("client");
var keys = require("../../../redis/keys");
var async = require("async");
var colors = require("colors/safe");

if (require.main === module) {
  main(process.argv[2], function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });
}

function main(string, callback) {
  var types = {};

  keys("*", function(err, keys) {
    if (err) return callback(err);

    async.each(
      keys,
      function(key, next) {
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
              stringSearch(string, keys, next);
            } else if (type === "hash") {
              hashSearch(string, keys, next);
            } else if (type === "set") {
              setSearch(string, keys, next);
            } else {
              next(new Error("No handlers for strings of type: " + type));
            }
          },
          callback
        );
      }
    );
  });
}

function stringSearch(string, keys, callback) {
  var print = new Print(string, 'STRING');
  async.each(
    keys,
    function(key, next) {
      client.get(key, function(err, value) {
        if (err) return next(err);
        if (!value) return next();
        if (value.indexOf(string) === -1) return next();

        print(key, value);
        next();
      });
    },
    callback
  );
}

function hashSearch(string, keys, callback) {
  var print = new Print(string, 'HASH');

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
            print(key, property, res[property]);

        next();
      });
    },
    callback
  );
}

function setSearch(string, keys, callback) {
  var print = new Print(string, 'SET');

  async.each(
    keys,
    function(key, next) {
      client.smembers(key, function(err, members) {
        if (err) return next(err);
        if (!members) return next();

        members.forEach(function(member) {
          if (member.indexOf(string) > -1) print(key, member);
        });

        next();
      });
    },
    callback
  );
}

function Print(str, type) {
  return function() {
    var args = Array.from(arguments);
    var key = args[0];
    var vals = args.slice(1);
    var res = colors.dim(type) + ' ' + key;

    vals.forEach(function(val) {
      val = val
        .split(str)
        .join(colors.white(str));

      res += " " + colors.dim(val);
    });

    console.log(res);
  };
}

module.exports = main;
