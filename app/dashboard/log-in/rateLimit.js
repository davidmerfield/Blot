var moment = require("moment");
var rateLimit = require("express-rate-limit");
var RedisStore = require("rate-limit-redis");
var client = require("models/client");

var limiter = rateLimit({
  store: new RedisStore({
    prefix: "rate-limit:log-in:",
    client: client,
  }),
  windowMs: 60000, // one minute window
  max: 60, // 1 attempt per second
});

module.exports = limiter;
