var express = require('express');
var router = express.Router();

var moment = require('moment');
var TODO = require('path').resolve(__dirname + '/../../../notes/todo.txt');
var exec = require('child_process').exec;
var CHANGES = 'git log -100';
var fs = require('fs-extra');
var marked = require('marked');
var helper = require('helper');

router.get('/', function(req, res, next){

  fs.readFile(TODO, 'utf-8', function(err, todo){

    exec(CHANGES, {cwd: helper.rootDir}, function(err, output){

      if (err) return next(err);

      output = output.split('\n\n');

      var commits = [];

      output.forEach(function(item, i){

        if (i % 2 === 0) {

          var message = output[i + 1].trim();

          message = message[0].toUpperCase() + message.slice(1);

          // Ignore changes to TODO file and messages with URLS
          if (message.split(' ').join('').toLowerCase().indexOf('todo') > -1) return;
          if (message.split(' ').join('').toLowerCase().indexOf('://') > -1) return;

          commits.push({
            author: item.slice(item.indexOf('Author:') + 'Author:'.length, item.indexOf('<')).trim(),
            date: moment(new Date(item.slice(item.indexOf('Date:') + 'Date:'.length).trim())).fromNow(),
            hash: item.slice(item.indexOf('commit ') + 'commit '.length, item.indexOf('Author')).trim(),
            message: message
          });
        }
      });

      res.locals.todo = marked(todo);
      res.locals.commits = commits;
      res.locals.title = 'Updates';
      res.locals.menu = {'updates': 'selected'};

      res.render('updates');
    });
  });
});

module.exports = router;