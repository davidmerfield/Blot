var Express = require("express");
var news = new Express.Router();
var moment = require("moment");
var exec = require("child_process").exec;
var fs = require("fs-extra");
var marked = require("marked");
var helper = require("helper");
var parse = require("body-parser").urlencoded({ extended: false });
var uuid = require("uuid/v4");
var config = require("config");
var client = require("client");

var listKey = "newsletter:list";
var TTL = 60 * 60 * 24; // 1 day in seconds

news.get("/", loadDone, loadToDo, function (req, res) {
  res.render("about/news");
});

// The rest of these pages should not be cached
news.use(function (req, res, next) {
  res.header("Cache-Control", "no-cache");
  next();
});

news.get("/sign-up", function (req, res) {
  if (req.session && req.session.newsletter_email) {
    res.locals.email = req.session.newsletter_email;
    delete req.session.newsletter_email;
  } else {
    return res.redirect(req.baseUrl);
  }

  res.render("about/news/sign-up");
});

news.get("/cancel", function (req, res) {
  if (req.session && req.session.newsletter_email) {
    res.locals.email = req.session.newsletter_email;
    delete req.session.newsletter_email;
  }

  res.render("about/news/cancel");
});

function confirmationKey(guid) {
  return "newsletter:confirm:" + guid;
}

function cancellationKey(guid) {
  return "newsletter:cancel:" + guid;
}

function confirmationLink(guid) {
  return "https://" + config.host + "/about/news/confirm/" + guid;
}

function cancellationLink(guid) {
  return "https://" + config.host + "/about/news/cancel/" + guid;
}

// Removes guid from visible breadcrumbs
news.param("guid", function (req, res, next) {
  res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, -1);
  next();
});

news.post("/cancel", parse, function (req, res, next) {
  var cancel, email, locals;
  var guid = uuid();

  if (!req.body || !req.body.email) {
    return next(new Error("No email"));
  }

  email = req.body.email.trim().toLowerCase();
  guid = guid.split("-").join("");
  guid = encodeURIComponent(guid);
  cancel = cancellationLink(guid);
  locals = { email: email, cancel: cancel };

  client.sismember(listKey, email, function (err, stat) {
    if (err || !stat) return next(err || new Error("No subscription found"));

    client.setex(cancellationKey(guid), TTL, email, function (err) {
      if (err) return next(err);

      helper.email.NEWSLETTER_CANCELLATION_CONFIRMATION(null, locals, function (
        err
      ) {
        if (err) return next(err);

        req.session.newsletter_email = email;
        res.redirect("/about/news/cancel");
      });
    });
  });
});

news.get("/cancel/:guid", function (req, res, next) {
  var guid = decodeURIComponent(req.params.guid);

  client.get(cancellationKey(guid), function (err, email) {
    if (err || !email) return next(err || new Error("No email"));

    client.srem(listKey, email, function (err, removed) {
      if (err) return next(err);

      var locals = { email: email };

      res.locals.title = "Cancelled";
      res.locals.email = email;
      res.render("about/news/cancelled");

      if (removed) {
        helper.email.NEWSLETTER_CANCELLATION_CONFIRMED(
          null,
          locals,
          function () {
            // Email confirmation sent
          }
        );
      }
    });
  });
});

news.get("/confirm/:guid", function (req, res, next) {
  var guid = decodeURIComponent(req.params.guid);

  client.get(confirmationKey(guid), function (err, email) {
    if (err || !email) return next(err || new Error("No email"));

    client.sadd(listKey, email, function (err, added) {
      if (err) return next(err);

      var locals = {
        email: email,
        cancel: "https://" + config.host + "/news/cancel",
      };

      res.locals.title = "Confirmed";
      res.locals.email = email;
      res.render("about/news/confirmed");

      // The first time the user clicks the confirmation
      // link we send out a confirmation email, subsequent
      // clicks they just see the confirmation page.
      if (added) {
        helper.email.NEWSLETTER_SUBSCRIPTION_CONFIRMED(
          null,
          locals,
          function () {
            // Email confirmation sent
          }
        );
      }
    });
  });
});

news.post("/sign-up", parse, function (req, res, next) {
  var confirm, email, locals;
  var guid = uuid();

  if (!req.body || !req.body.email) {
    return next(new Error("No email"));
  }

  email = req.body.email.trim().toLowerCase();
  guid = guid.split("-").join("");
  guid = encodeURIComponent(guid);
  confirm = confirmationLink(guid);
  locals = { email: email, confirm: confirm };

  client.setex(confirmationKey(guid), TTL, email, function (err) {
    if (err) return next(err);

    helper.email.NEWSLETTER_SUBSCRIPTION_CONFIRMATION(null, locals, function (
      err
    ) {
      if (err) return next(err);

      req.session.newsletter_email = email;
      res.redirect("/about/news/sign-up");
    });
  });
});

function loadToDo(req, res, next) {
  fs.readFile(__dirname + "/../../../todo.txt", "utf-8", function (err, todo) {
    if (err) return next(err);
    res.locals.todo = marked(todo);

    var html = res.locals.todo;
    var $ = require("cheerio").load(html);

    $("ul").each(function () {
      var ul = $(this).html();
      var p = $(this).prev().html();

      $(this).prev().remove();
      $(this).replaceWith(
        "<details><summary>" + p + "</summary><ul>" + ul + "</ul></details>"
      );
    });

    res.locals.todo = $.html();
    return next();
  });
}

// Ignores merge commits since they're not useful to readers
// Ignores commits mentioning 'commit' since they're not useful to readers
// Ignores commits to yml test file since there are so many of them
// Ignores commits to todo file since there are so many of them
// Ignores commits with links since they're ugly
const bannedWords = ["merge", "typo", "commit", ".yml", "todo", "://"];
const bannedWordsRegEx = new RegExp(bannedWords.join("|"), "i");

// Adjust the tense of verbs in commit message
const commitMessageMap = {
  Adds: "Added",
  Cleans: "Cleaned",
  Changes: "Changed",
  Fixes: "Fixed",
  Finishes: "Finished",
  Improves: "Improved",
  Modifies: "Modified",
  Removes: "Removed",
  Tweaks: "Tweaked",
  Updates: "Updated",
};

const commitMessageMapRegEx = new RegExp(
  Object.keys(commitMessageMap).join("|"),
  "g"
);

function loadDone(req, res, next) {
  exec("git log -300", { cwd: helper.rootDir }, function (err, output) {
    if (err) return next(err);

    output = output.split("\n\n");

    var commits = [];
    var messageMap = {};

    output.forEach(function (item, i) {
      if (i % 2 === 0) {
        var message = output[i + 1].trim();

        message = message[0].toUpperCase() + message.slice(1);

        if (bannedWordsRegEx.test(message)) return;

        message = message.replace(commitMessageMapRegEx, function (matched) {
          return commitMessageMap[matched];
        });

        // Before: Add removal of old backups (#393)
        // After:  Add removal of old backups
        if (message.indexOf("(#") > -1)
          message = message.slice(0, message.indexOf("(#"));

        // Prevent duplicate messages appearing on news page
        if (messageMap[message]) return;
        else messageMap[message] = true;

        commits.push({
          author: item
            .slice(
              item.indexOf("Author:") + "Author:".length,
              item.indexOf("<")
            )
            .trim(),
          date: new Date(
            item.slice(item.indexOf("Date:") + "Date:".length).trim()
          ),
          hash: item
            .slice(
              item.indexOf("commit ") + "commit ".length,
              item.indexOf("Author")
            )
            .trim(),
          message: message.trim(),
        });
      }
    });

    const dateFormat = "MMM D, YYYY";
    const today = moment().format(dateFormat);
    const yesterday = moment().subtract(1, "days").format(dateFormat);
    let days = [];

    commits.forEach((commit) => {
      commit.time = moment(commit.date).format(dateFormat);

      if (commit.time === today) commit.time = "today";
      else if (commit.time === yesterday) commit.time = "yesterday";
      else commit.time = "on " + commit.time;

      let currentday = days[days.length - 1];

      if (currentday && currentday[0] && currentday[0].time === commit.time) {
        currentday.push(commit);
      } else {
        days.push([commit]);
      }
    });

    res.locals.days = days.map((commits) => {
      return { day: commits[0].time, commits };
    });

    next();
  });
}

module.exports = news;
