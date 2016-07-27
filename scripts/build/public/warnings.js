var fs = require('fs');
var rootDir = require('helper').rootDir;
var SYSTEM_FILES = ['.DS_Store', '.git'];

module.exports = function check (source, output) {

  var output_contents = fs.readdirSync(output);

  output_contents.forEach(function(name){

    if (SYSTEM_FILES.indexOf(name) > -1) return;

    var source_stat, output_stat, source_path, output_path;

    source_path = source + '/' + name;
    output_path = output + '/' + name;

    output_stat = fs.statSync(output_path);

    var actualPath = output_path.slice(rootDir.length);

    if (actualPath.toLowerCase() !== actualPath) {
      console.log('⚠  Warning: case-sensitive path', output_path);
    }

    if (actualPath.indexOf(' ') > -1) {
      console.log('⚠  Warning: path contains spaces', output_path);
    }

    try {
      source_stat = fs.statSync(source_path);
    } catch (e) {

      if (e.code === 'ENOENT')
        console.log('⚠  Warning:', output_path, 'exists in output but not source');
      else
        console.log('⚠  Error:', e);

      return;
    }

    if (output_stat.isDirectory())
      check(source_path, output_path);
  });
};

