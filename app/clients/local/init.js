var fs = require("fs-extra");
var Folder = require("clients/local/models/folder");
var debug = require("debug")("blot:clients:local:setup");
var watch = require("./controllers/watch");
var setup = require("./controllers/setup");
var redis = require("ioredis");
var config = require("config");
var client = new redis(config.redis.port);
var clfdate = require("helper/clfdate");

const prefix = () => clfdate() + " Local folder client:";

module.exports = () => {
  // This communication channel allows us to load in and out
  // new blogs in external scripts. We send a message to this
  // channel in scripts/load/info.js
  var CHANNEL = "clients:local:new-folder";
  console.log(prefix(), "Listening");
  client.subscribe(CHANNEL);
  client.on("message", function (channel, message) {
    debug("recieved", message, "on", channel);
    if (channel !== CHANNEL) return;
    let { blogID, folder } = JSON.parse(message);
    setup(blogID, folder, function (err) {
      if (err) console.error(err);
    });
  });

  Folder.list(function (err, blogIDs) {
    if (err) console.error(err);
    blogIDs.forEach(function (blogID) {
      console.log(prefix(), "Blog:", blogID, "Setting up");
      Folder.get(blogID, function (err, folder) {
        if (err) console.error(err);
        if (!folder) return;
        if (!fs.existsSync(folder)) return;

        console.log(prefix(), "Synchronizing", folder);
        setup.synchronize(blogID, folder, function (err) {
          if (err) console.error(err);

          console.log(prefix(), "Watching", folder);
          watch(blogID, folder);

          console.log(prefix(), "Blog:", blogID, "Set up successfully");
        });
      });
    });
  });
};
