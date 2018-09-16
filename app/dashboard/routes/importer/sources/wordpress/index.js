var load = require('./load');
var parse = require('./parse');
var fs = require('fs-extra');

if (require.main === module) main(process.argv[2], process.argv[3], function(err){

  if (err) throw err;

  console.log('Here!');
  
  process.exit();
});

function main (source_file, output_directory, callback) {

  load(source_file, function(err, $){

    if (err) return callback(err);

    fs.emptyDir(output_directory, function(err){
    
      if (err) return callback(err);
    
      parse($, output_directory, callback);
    });
  });
}

module.exports = main;