var exec = require('child_process').exec;
var async = require('async');

var packageJSON = require('../package.json');

var unused = [];

async.eachOf(packageJSON.dependencies, function(ver, name, next){

  exec(__dirname + '/check_dependency.sh ' + name, {silent: true}, function(err, res){

    if (err) return next(err);

    var results = res.split('\n').filter(function(line){
      return line.trim();
    }).length;

    if (results) {
      console.log(name + ' used ' + results + ' times.');
    } else {
      console.warn('Warning:', name, 'was NOT found.');
      unused.push(name);
    }

    next();
  });

}, function(err){
  if (err) throw err;

  console.log('Done! These packages are unused:');
  console.log(unused);
});