var fs = require("fs-extra");
var async = require("async");
var config = require("config");
var ensure = require("../ensure");
var extend = require("../extend");
var tempDir = require("../tempDir")();
var Mustache = require("mustache");
var marked = require("marked");

var Mailgun = require("mailgun-js");
var mailgun;

if (config && config.mailgun && config.mailgun.key) {
  mailgun = new Mailgun({
    apiKey: config.mailgun.key,
    domain: config.mailgun.domain,
  });
} else {
  mailgun = {
    messages: function () {
      return {
        send: function (email, callback) {
          callback(null);
        },
      };
    },
  };
}

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
  "BILLING_INTERVAL",
  "CANCELLED",
  "CLOSED",
  "CREATED_BLOG",
  "DAILY_UPDATE",
  "DELETED",
  "DISABLED",
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
  "RECOVERED",
  "REVOKED",
  "SET_PASSWORD",
  "SERVER_START",
  "SUBSCRIPTION_DECREASE",
  "SYNC_DOWN",
  "SYNC_EXCEPTION",
  "SYNC_REPORT",
  "UPCOMING_RENEWAL",
  "UPCOMING_EXPIRY",
  "UPDATE_BILLING",
  "WARNING_LOW_DISK_SPACE",
  "WORKER_ERROR"
];

var globals = {
  site: "https://" + config.host,
};

var EMAIL_MODEL = {
  to: "string",
  from: "string",
  subject: "string",
  html: "string",
};

function loadUser(uid, callback) {
  if (!uid) return callback(null, {});

  const User = require("models/user");

  User.getById(uid, function (err, user) {
    if (err || !user) {
      return callback(err || new Error("No user with uid " + uid));
    }

    user = User.extend(user);

    callback(null, user);
  });
}

function init(method) {
  ensure(method, "string");
  return function build(uid = "", locals = {}, callback = function () {}) {
    loadUser(uid, function (err, user) {
      if (err) return callback(err);

      extend(locals).and(globals).and(user);

      const adminMessage = adminDir + method + ".txt";
      const userMessage = userDir + method + ".txt";

      let emails = [];

      if (fs.existsSync(adminMessage)) {
        emails.push(send.bind(this, locals, adminMessage, ADMIN));
      }

      if (fs.existsSync(userMessage)) {
        emails.push(send.bind(this, locals, userMessage, locals.email));
      }

      async.parallel(emails, callback);
    });
  };
}

function send(locals, messageFile, to, callback) {
  ensure(locals, "object")
    .and(messageFile, "string")
    .and(to, "string")
    .and(callback, "function");

  fs.readFile(messageFile, "utf-8", function (err, text) {
    if (err) throw err;

    var lines = text.split("\n");
    var subject = Mustache.render(lines[0] || "", locals);
    var message = lines.slice(2).join("\n") || "";

    var html = marked(Mustache.render(message, locals));

    var email = {
      html: html,
      subject: subject,
      from: locals.from || FROM,
      to: to,
    };

    ensure(email, EMAIL_MODEL);

    if (config.environment === "development") {
      var previewPath = tempDir + Date.now() + ".html";
      fs.outputFileSync(previewPath, email.html, "utf-8");
      console.log("Email not sent in development environment:", email);
      console.log("Preview:", previewPath);
      return callback();
    }

    mailgun.messages().send(email, function (err, body) {
      if (err) {
        console.log("Error: Mailgun failed to send transactional email:", err);
        return callback(err);
      }

      console.log(
        "Sent to",
        email.to,
        '"' + email.subject + '"',
        "(" + body.id + ")"
      );
      callback();
    });
  });
}

var exports = {};

for (var i in MESSAGES) {
  var method = MESSAGES[i];
  exports[method] = init(method);
}

exports.send = send;

module.exports = exports;
