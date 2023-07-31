const mustache = require("mustache");
const config = require("config");
const fs = require("fs-extra");

const template = fs.readFileSync(__dirname + "/server.mustache", "utf8");
const partials = {};

fs.readdirSync(__dirname + "/partials").forEach((file) => {
  if (!file.endsWith(".mustache")) return;
  partials[file] = fs.readFileSync(__dirname + "/partials/" + file, "utf8");
});

const result = mustache.render(
  template,
  { development: config.environment === "development", host: config.host },
  partials
);

console.log(partials);

fs.outputFileSync(__dirname + "/server.conf", result);
