const Mailgun = require("mailgun-js");
const config = require("config");
const from = config.mailgun.from;
const mailgun = new Mailgun({
  apiKey: config.mailgun.key,
  domain: config.mailgun.domain,
});

const to = process.argv[2];

if (!to) {
  console.log("Please provide an email address");
  process.exit(1);
}

const subject = process.argv[3] || "Test email";
const html = process.argv[4] || "<p>This is a test email</p>";

var email = {
  html,
  subject,
  from,
  to,
};

mailgun.messages().send(email, function (err, body) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log("Email sent");
  process.exit(0);
});
