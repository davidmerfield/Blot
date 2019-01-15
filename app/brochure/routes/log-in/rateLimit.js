var moment = require("moment");
var Brute = require("express-brute");
var RedisStore = require("express-brute-redis");
var client = require("client");

var store = new RedisStore({
  client: client,
  prefix: "brute:"
});

var limiter = new Brute(store, {
  freeRetries: 1500, // max # of access to log in pages per day
  failCallback: onLimit
});

function onLimit(req, res, next, until) {
  res
    .status(429)
    .send(
      "Log in rate limit hit. Please wait " +
        moment(until).toNow(true) +
        " before retrying."
    );
}

module.exports = limiter.prevent;
