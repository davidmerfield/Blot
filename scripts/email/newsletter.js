var helper = require("../../app/helper");
var send = helper.email.send;
var letter = process.argv[2];
var fs = require("fs");
var client = require("../../app/models/client");
var async = require("async");

if (!letter) {
  console.log("Select an email to send:");
  fs.readdirSync(__dirname + "/../../app/helper/email/newsletters").forEach(
    function(letter) {
      console.log("node scripts/email/newsletter", letter);
    }
  );
  process.exit();
}

main(letter, function(err) {
  if (err) throw err;

  console.log("All emails delivered!");
  process.exit();
});

function main(letter, callback) {
  var emailPath = __dirname + "/../../app/helper/email/newsletters/" + letter;

  if (!fs.statSync(emailPath).isFile())
    return callback(new Error("Not a file"));

  getAllSubscribers(function(err, emails) {
    if (err) return callback(err);

    console.log('Sending ' + letter + ' out to ' + emails.length + ' subscribers');

    async.filter(emails, alreadySent, function(err, emails) {
      if (err) return callback(err);

      async.eachSeries(
        emails,
        function(email, next) {
          console.log("Sending", email);

          send({ email: email }, emailPath, email, function(err) {
            if (err) return next(err);

            console.log(". Email sent to", email);
            client.sadd("newsletter:letter:" + letter, email, next);
          });
        },
        callback
      );
    });
  });
}

function getAllSubscribers(callback) {
  client.smembers("newsletter:list", callback);
}

function alreadySent(email, done) {
  client.sismember("newsletter:letter:" + letter, email, function(err, member) {
    if (member === 1) console.log("Email already sent to", email);
    done(err, member === 0);
  });
}
