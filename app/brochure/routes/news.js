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

news.get("/", loadDone, loadToDo, function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news");
});

news.get("/archive", function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news/archive");
});

news.get("/archive/:letter", function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news/archive");
});

// The rest of these pages should not be cached
news.use(function(req, res, next) {
  res.header("Cache-Control", "no-cache");
  next();
});

news.get("/sign-up", function(req, res) {
  if (req.session && req.session.newsletter_email) {
    res.locals.email = req.session.newsletter_email;
    delete req.session.newsletter_email;
  }

  res.render("news/sign-up");
});

function confirmationKey(guid) {
  return "newsletter:confirm:" + guid;
}

var listKey = "newsletter:list";
var TTL = 60 * 60 * 24; // 1 day in seconds

function confirmationLink(guid) {
  return "https://" + config.host + "/news/confirm/" + guid;
}

news.get("/confirm/:guid", function(req, res, next) {
  var guid = decodeURIComponent(req.params.guid);

  client.get(confirmationKey(guid), function(err, email) {
    if (err || !email) return next(err || new Error("No email"));

    client.sadd(listKey, email, function(err) {
      if (err) return next(err);

      res.locals.email = email;
      res.render("news/confirmed");
    });
  });
});

news.post("/sign-up", parse, function(req, res, next) {
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

  client.setex(confirmationKey(guid), TTL, email, function(err) {
    if (err) return next(err);

    helper.email.SUBSCRIBE_CONFIRMATION(null, locals, function(err) {
      if (err) return next(err);

      req.session.newsletter_email = email;
      res.redirect("/news/sign-up");
    });
  });
});

function loadToDo(req, res, next) {
  fs.readFile(__dirname + "/../../../todo.txt", "utf-8", function(err, todo) {
    if (err) return next(err);
    res.locals.todo = marked(todo);

    var html = res.locals.todo;
    var $ = require("cheerio").load(html);

    $("ul").each(function() {
      var ul = $(this).html();
      var p = $(this)
        .prev()
        .html();

      $(this)
        .prev()
        .remove();
      $(this).replaceWith(
        "<details><summary>" + p + "</summary><ul>" + ul + "</ul></details>"
      );
    });

    res.locals.todo = $.html();
    return next();
  });
}

function loadDone(req, res, next) {
  exec("git log -100", { cwd: helper.rootDir }, function(err, output) {
    if (err) return next(err);

    output = output.split("\n\n");

    var commits = [];

    output.forEach(function(item, i) {
      if (i % 2 === 0) {
        var message = output[i + 1].trim();

        message = message[0].toUpperCase() + message.slice(1);

        // Ignore changes to TODO file, pull request and branch merges, and messages with URLS
        if (message.indexOf("Merge pull request") === 0) return;
        if (message.indexOf("Merge branch") === 0) return;
        if (
          message
            .split(" ")
            .join("")
            .toLowerCase()
            .indexOf("todo") > -1
        )
          return;
        if (
          message
            .split(" ")
            .join("")
            .toLowerCase()
            .indexOf("://") > -1
        )
          return;

        commits.push({
          author: item
            .slice(
              item.indexOf("Author:") + "Author:".length,
              item.indexOf("<")
            )
            .trim(),
          date: moment(
            new Date(item.slice(item.indexOf("Date:") + "Date:".length).trim())
          ).fromNow(),
          hash: item
            .slice(
              item.indexOf("commit ") + "commit ".length,
              item.indexOf("Author")
            )
            .trim(),
          message: message
        });
      }
    });

    res.locals.commits = commits;
    next();
  });
}

module.exports = news;
