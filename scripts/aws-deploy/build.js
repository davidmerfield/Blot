const mustache = require("mustache");
const fs = require("fs-extra");

const env = Object.keys(process.env)
  .filter((key) => key.indexOf("BLOT_") > -1)
  .map((key) => ({ key, value: process.env[key] }));

const view = {
  env,
  directory: process.env.BLOT_DIRECTORY,
  blot_repo: "https://github.com/davidmerfield/blot",
  user: process.env.BLOT_USER, // unix user
  host: process.env.BLOT_HOST,
  environment_file: "/etc/blot/environment",
  fallback_certificate: "/etc/ssl/auto-ssl-fallback.crt",
  fallback_certificate_key: "/etc/ssl/auto-ssl-fallback.key",
  log_file: process.env.BLOT_DIRECTORY + "/logs/nginx.log",
  cache_directory: process.env.BLOT_CACHE_DIRECTORY,
  node: {
    host: "127.0.0.1",
    bin: `/.nvm/versions/node/v${process.env.BLOT_NODE_VERSION}/bin/node`,
    main: process.env.BLOT_DIRECTORY + "/app/index.js",
    log: process.env.BLOT_DIRECTORY + "/logs/app.log",
    version: process.env.BLOT_NODE_VERSION,
    port: 8080,
  },
  number_of_cpus: 4,
  nginx: {
    pid: "/var/run/nginx.pid",
    bin: "/usr/local/openresty/nginx/sbin/nginx",
    config: process.env.BLOT_DIRECTORY + "/scripts/deploy/out/nginx.conf",
  },
  redis: {
    pid: "/var/run/redis/redis.pid",
    host: "127.0.0.1",
    port: 6379,
    maxmemory: 18000000000,
    prefix: "ssl",
    server: "/usr/bin/redis-server",
    config: process.env.BLOT_DIRECTORY + "/scripts/deploy/out/redis.conf",
    cli: "/usr/bin/redis-cli",
  },
};

let partials = {};

fs.readdirSync(__dirname + "/nginx").forEach((name) => {
  partials[name] = fs.readFileSync(__dirname + "/nginx/" + name, "utf8");
});

render(__dirname + "/nginx/server.conf", __dirname + "/out/nginx.conf");
render(__dirname + "/redis/redis.conf", __dirname + "/out/redis.conf");
render(__dirname + "/systemd/nginx.service", __dirname + "/out/nginx.service");
render(__dirname + "/systemd/redis.service", __dirname + "/out/redis.service");
render(__dirname + "/systemd/blot.service", __dirname + "/out/blot.service");
render(__dirname + "/user-data.sh", __dirname + "/out/user-data.sh");

function render(input, out) {
  // Disable mustache's default escaping
  mustache.escape = function (text) {
    return text;
  };

  const template = fs.readFileSync(input, "utf8");
  fs.ensureDirSync(__dirname + "/out");
  fs.writeFileSync(out, mustache.render(template, view, partials));
}
