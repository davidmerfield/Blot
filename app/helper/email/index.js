var config = require("config");
var fs = require("fs-extra");
var ensure = require("../ensure");
var extend = require("../extend");
var tempDir = require("../tempDir")();
var assert = require("assert");
var logg = require("../logg");
var log = new logg("Email");
var Mustache = require("mustache");
var marked = require("marked");

var Mailgun = require("mailgun-js");
var mailgun = new Mailgun({
  apiKey: config.mailgun.key,
  domain: config.mailgun.domain
});

var adminDir = __dirname + "/admin/";
var userDir = __dirname + "/user/";

var ADMIN = config.admin.email;
var FROM = config.mailgun.from;

// This module checks /user and /admin
// for each message + .txt in the list
// below. If it finds a file in /admin
// it will send it to me. If it finds
// a file in /user, it will send it
// to the user whose uid was passed.
var MESSAGES = [
  "ALREADY_CANCELLED",
  "BAD_REQUEST",
  "CANCELLED",
  "CLOSED",
  "DAILY_UPDATE",
  "DELETED",
  "DISABLED",
  "FAILED_PAYMENT",
  "LONG_DELAY",
  "NETWORK_ERROR",
  "NEWSLETTER_SUBSCRIPTION_CONFIRMED",
  "NEWSLETTER_SUBSCRIPTION_CONFIRMATION",
  "NEWSLETTER_CANCELLATION_CONFIRMED",
  "NEWSLETTER_CANCELLATION_CONFIRMATION",
  "NO_SPACE",
  "OVERDUE",
  "OVERDUE_CLOSURE",
  "RATE_LIMIT",
  "RESTART",
  "REVOKED",
  "SET_PASSWORD",
  "SUBSCRIPTION_INCREASE",
  "SUBSCRIPTION_DECREASE",
  "SYNC_DOWN",
  "SYNC_EXCEPTION",
  "UPCOMING_RENEWAL",
  "UPCOMING_EXPIRY",
  "UPDATE_BILLING",
  "WARNING_LOW_DISK_SPACE"
];

var NO_MESSAGE = "No messages found for";
var NO_ADDRESS = "No email passed, or uid passed for";

var globals = {
  site: "https://" + config.host
};

var EMAIL_MODEL = {
  to: "string",
  from: "string",
  subject: "string",
  html: "string"
};

function init(method) {
  ensure(method, "string");

  var adminMessage = adminDir + method + ".txt";
  var userMessage = userDir + method + ".txt";

  var emailAdmin = fs.existsSync(adminMessage);
  var emailUser = fs.existsSync(userMessage);

  return function build(uid, locals, callback) {
    uid = uid || "";
    locals = locals || {};
    callback = callback || function() {};

    if (!uid) return then();

    require("user").getById(uid, function(err, user) {
      if (err || !user) return log(err || "No user with uid " + uid);

      extend(locals)
        .and(globals)
        .and(require("user").extend(user));

      then();
    });

    function then() {
      if (emailAdmin) send(locals, adminMessage, ADMIN, callback);

      if (emailUser && locals.email)
        send(locals, userMessage, locals.email, callback);

      if (emailUser && !locals.email) log(NO_ADDRESS, method);

      if (!emailAdmin && !emailUser) log(NO_MESSAGE, method);
    }
  };
}

function send(locals, messageFile, to, callback) {
  ensure(locals, "object")
    .and(messageFile, "string")
    .and(to, "string")
    .and(callback, "function");

  fs.readFile(messageFile, "utf-8", function(err, text) {
    if (err) throw err;

    var lines = text.split("\n");
    var subject = Mustache.render(lines[0] || "", locals);
    var message = lines.slice(2).join("\n") || "";

    var html = marked(Mustache.render(message, locals));

    var email = {
      html: html,
      subject: subject,
      from: locals.from || FROM,
      to: to
    };

    ensure(email, EMAIL_MODEL);

    if (config.environment === "development") {
      var previewPath = tempDir + Date.now() + ".html";
      fs.outputFileSync(previewPath, email.html, "utf-8");
      console.log("Preview:", previewPath);
    }

    if (config.environment === "development" && to !== config.admin.email) {
      console.log("Email not sent in development environment:", email);
      return callback();
    }

    mailgun.messages().send(email, function(err, body) {
      if (err) {
        console.log("Error: Mailgun failed to send transactional email:", err);
        return log(err);
      }

      log("Sent to", email.to, '"' + email.subject + '"', "(" + body.id + ")");
      callback();
    });
  });
}

var exports = {};

for (var i in MESSAGES) {
  var method = MESSAGES[i];

  exports[method] = init(method);

  assert(
    fs.existsSync(adminDir + method + ".txt") ||
      fs.existsSync(userDir + method + ".txt"),
    "There is no message file for " + method
  );
}

exports.send = send;

module.exports = exports;
