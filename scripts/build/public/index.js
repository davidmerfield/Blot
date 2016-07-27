var config = require('config');
var helper = require('helper');
var listen = require('./listen');
var directory = require('./directory');

var source = helper.rootDir + '/public';
var output = helper.rootDir + '/www';

console.log();
console.log('Building files and folders from', source, 'to', output);
console.log('-------------------------------------------');
directory(source, output, function(err){

  if (err) throw err;

  console.log('-------------------------------------------');
  console.log('Build complete!');

  if (config.environment === 'development')
    listen(source, output);
});