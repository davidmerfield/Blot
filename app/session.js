var redis = require("redis").createClient();
var config = require("config");
var session = require("express-session");
var Store = require("connect-redis")(session);

// Session settings
// It is important that session
// comes before the cache so we
// know what to serve to which user
var sessionOptions = {
  secret: config.session.secret,
  saveUninitialized: false,
  resave: false,
  proxy: true,
  cookie: {
    httpOnly: true
  },
  store: new Store({
    client: redis,
    port: config.redis.port
  })
};

module.exports = session(sessionOptions);
