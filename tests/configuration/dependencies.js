var exec = require('child_process').exec;
var async = require('async');
var packageJSON = require('../../package.json');

if (require.main === module) main(function(err, unused, res){
  for (var i in res)
    console.log(i + ' used ' + res[i] + ' times');
  console.log();

  if (unused.length) {
  console.log('Unused dependencies', unused);
  } else {
    console.log('No unused dependencies!');
  }
});

function main (callback) {

  var unused = [];
  var res = {};

  async.eachOfLimit(packageJSON.dependencies, 5, function(ver, name, next){

    exec(__dirname + '/check_dependency.sh ' + name, {silent: true}, function(err, stdout){

      if (err) return next(err);

      var results = stdout.split('\n').filter(function(line){
        return line.trim();
      }).length;

      res[name] = results;

      if (!results) unused.push(name);

      next();
    });

  }, function(err){
    callback(err, unused, res);
  });
}

module.exports = main;