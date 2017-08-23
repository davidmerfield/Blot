module.exports = function(server){

  var moment = require('moment');
  var TODO = require('path').resolve(__dirname + '/../../../notes/todo.txt');
  var exec = require('child_process').exec;
  var CHANGES = 'git log -100';
  var fs = require('fs-extra');
  var marked = require('marked');
  var helper = require('helper');

  server.get('/changes', function(req, res, next){

    fs.readFile(TODO, 'utf-8', function(err, todo){

      exec(CHANGES, {cwd: helper.rootDir}, function(err, output){

        if (err) return next(err);

        output = output.split('\n\n');

        var commits = [];

        output.forEach(function(item, i){

          if (i % 2 === 0) {

            var message = output[i + 1].trim();

            message = message[0].toUpperCase() + message.slice(1);

            commits.push({
              author: item.slice(item.indexOf('Author:') + 'Author:'.length, item.indexOf('<')).trim(),
              date: moment(new Date(item.slice(item.indexOf('Date:') + 'Date:'.length).trim())).fromNow(),
              hash: item.slice(item.indexOf('commit ') + 'commit '.length, item.indexOf('Author')).trim(),
              message: message
            });
          }
        });

        res.addLocals({
          partials: {yield: 'changes'},
          title: 'Changes',
          todo: marked(todo),
          commits: commits
        });

        res.render('_wrapper');
      });
    });
  });


};