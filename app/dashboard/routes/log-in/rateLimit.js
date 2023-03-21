var moment = require("moment");
var rateLimit = require("express-rate-limit");
var RedisStore = require("rate-limit-redis");
var client = require("client");

var limiter = rateLimit({
  store: new RedisStore({
    prefix: "rate-limit:log-in:",
    client: client,
  }),
  windowMs: 60000, // one minute window
  max: 60, // 1 attempt per second
  onLimitReached,
});

function onLimitReached(req, res, options) {
  res.status(429).send("Log in rate limit hit. Please wait before retrying.");
}

module.exports = limiter;
