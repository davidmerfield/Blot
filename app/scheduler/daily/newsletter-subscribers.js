if (require.main === module) {
  main(function(err, subscribers) {
    if (err) throw err;

    console.log(subscribers.join(" "));

    console.log();
    console.log(subscribers.length + " subscribed to the newsletter");
    process.exit();
  });
}

function main(callback) {
  require("redis")
    .createClient()
    .smembers("newsletter:list", function(err, subscribers) {
      callback(null, { newsletter_subscribers: subscribers.length });
    });
}

module.exports = main;
