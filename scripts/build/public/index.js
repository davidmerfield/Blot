var config = require('config');
var helper = require('helper');
var listen = require('./listen');
var directory = require('./directory');
var warnings = require('./warnings');
var log = require('single-line-log').stdout;

var source = helper.rootDir + '/public';
var output = helper.rootDir + '/www';

console.log();
console.log('Building files and folders from', source, 'to', output);
console.log('-------------------------------------------');
directory(source, output, function(err){

  if (err) throw err;

  log(); // clear log line

  console.log();
  console.log('Checking for warnings in', source);
  console.log('-------------------------------------------');

  warnings(source, output);

  if (config.environment === 'development')
    listen(source, output);
});