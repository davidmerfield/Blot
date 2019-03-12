var Express = require("express");
var news = new Express.Router();
var moment = require("moment");
var exec = require("child_process").exec;
var fs = require("fs-extra");
var marked = require("marked");
var helper = require("helper");
var parse = require("body-parser").urlencoded({ extended: false });

news.get("/", loadDone, loadToDo, function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news");
});


news.get("/archive", loadDone, loadToDo, function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news/archive");
});

news.post('/sign-up', parse, function(req, res){
  console.log(req.body);
  res.render("news/sign-up");
});

function loadToDo(req, res, next) {
  fs.readFile(__dirname + "/../../../todo.txt", "utf-8", function(err, todo) {
    if (err) return next(err);
    res.locals.todo = marked(todo);

    var html = res.locals.todo;
    var $ = require('cheerio').load(html);

    $('ul').each(function(){
      var ul = $(this).html();
      var p = $(this).prev().html();

      $(this).prev().remove();
      $(this).replaceWith("<details><summary>" + p + "</summary><ul>" + ul + "</ul></details>");
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
