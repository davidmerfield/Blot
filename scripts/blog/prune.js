var each = require("../each/blog");
var Blog = require("models/blog");
var client = require("redis").createClient();
var getConfirmation = require("../util/getConfirmation");
let multi = client.multi();
let keysToDelete = {};

each(
  function (user, blog, next) {
    let hashKey = "blog:" + blog.id + ":info";
    client.hgetall(hashKey, function (err, res) {
      Object.keys(res).forEach((key) => {
        if (Blog.scheme.TYPE[key] !== undefined) return;
        multi.hdel(hashKey, key);
        keysToDelete[key] = keysToDelete[key] || 0;
        keysToDelete[key]++;
      });

      next();
    });
  },
  function (err) {
    if (err) throw err;
    if (!Object.keys(keysToDelete).length) {
      console.log("All blogs pruned");
      return process.exit();
    }

    console.log("Would delete:");
    Object.keys(keysToDelete).forEach((key) => {
      console.log(key, keysToDelete[key] + " blogs");
    });
    getConfirmation("Proceed?", function (err, ok) {
      if (!ok) {
        console.log("Did not prune.");
        return process.exit();
      }

      multi.exec((err) => {
        if (err) throw err;
        console.log("Pruned all blogs");
        process.exit();
      });
    });
  }
);
