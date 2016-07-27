var watcher = require('watcher');
var joinpath = require('path').join;
var file = require('./file');

module.exports = function (source, output) {

  console.log();
  console.log('Listening for changes in', source, 'to build to', output);
  console.log('-------------------------------------------');

  watcher(source, function(source_path){

    var output_path = joinpath(output, source_path.slice(source.length));

    file(source_path, output_path, function(){});
  });
};