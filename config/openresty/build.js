const mustache = require("mustache");
const config = require("config");
const fs = require("fs-extra");

const template = fs.readFileSync(__dirname + "/src/server.mustache", "utf8");
const partials = {};

fs.emptyDirSync(__dirname + '/data');

fs.readdirSync(__dirname + "/src/partials").forEach((file) => {
  if (!file.endsWith(".mustache")) return;
  partials[file] = fs.readFileSync(__dirname + "/src/partials/" + file, "utf8");
});

const result = mustache.render(
  template,
  {
    blot_directory: config.blot_directory,
    // development: config.environment === "development",
    host: "blot.im",
    node_ip: "172.30.0.145",
    node_port: config.port,
    redis: { host: "172.30.0.138" },
    user: "ec2-user",
    config_directory: "/home/ec2-user/openresty",
    ssl_certificate: "/etc/ssl/private/letsencrypt-domain.pem",
    ssl_certificate_key: "/etc/ssl/private/letsencrypt-domain.key",
  },
  partials
);


fs.copySync(__dirname + "/src/html", __dirname + "/data/html");
fs.outputFileSync(__dirname + "/data/openresty.conf", result);
