const config = require("config");
const guid = require("helper/guid");
const session = require("express-session");
const Store = require("connect-redis")(session);
const redis = require("redis").createClient();

// Session settings. It is important that session
// comes before the cache so we know what to serve
module.exports = session({
  // If no session secret is set we use a random GUID
  // this will mean that sessions will only be valid
  // for as long as the process is running.
  secret: config.session.secret || guid(),
  saveUninitialized: false,
  resave: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days in ms
  },
  store: new Store({
    client: redis,
    port: config.redis.port,
  }),
});
