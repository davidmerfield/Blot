if (require.main === module) {
  main(function (err, res) {
    if (err) throw err;

    console.log(res.newsletter_subscribers + " subscribed to the newsletter");
    process.exit();
  });
}

function main(callback) {
  var redis = require("models/redis");
  var client = new redis();
  client.smembers("newsletter:list", function (err, subscribers) {
    callback(null, { newsletter_subscribers: subscribers.length });
  });
}

module.exports = main;
