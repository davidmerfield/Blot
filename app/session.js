var redis = require("redis").createClient();
var config = require("config");
var session = require("express-session");
var Store = require("connect-redis")(session);

// Session settings. It is important that session
// comes before the cache so we know what to serve
var sessionOptions = {
  secret: config.session.secret,
  saveUninitialized: false,
  resave: false,
  proxy: true,
  maxAge: 1000 * 60 * 60 * 24 * 90, // 90 days in ms
  cookie: {
    httpOnly: true
  },
  store: new Store({
    client: redis,
    port: config.redis.port
  })
};

module.exports = session(sessionOptions);
