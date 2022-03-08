if (require.main === module) {
  main(function (err, res) {
    if (err) throw err;

    console.log(res.newsletter_subscribers + " subscribed to the newsletter");
    process.exit();
  });
}

function main(callback) {
  const redis = require("ioredis");
  const config = require("config");
  const client = new redis(config.redis.port);
  client
    .createClient()
    .smembers("newsletter:list", function (err, subscribers) {
      callback(null, { newsletter_subscribers: subscribers.length });
    });
}

module.exports = main;
