var fs = require('fs');

module.exports = function check (source, output) {

  var output_contents = fs.readdirSync(output);

  output_contents.forEach(function(name){

    var source_stat, output_stat, source_path, output_path;

    source_path = source + '/' + name;
    output_path = output + '/' + name;

    output_stat = fs.statSync(output_path);

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

