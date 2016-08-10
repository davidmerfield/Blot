var exec = require('child_process').exec;

// if script is invoked directly
if (require.main === module) main(function(err){
  if (err) console.log(err);
  process.exit();
});

function main (callback) {

  exec(__dirname + '/production/nginx_reboot.sh', function (error, stdout, stderr) {

    if (error) {
      console.log(stderr);
      return callback(error);
    }

    console.log(stdout);

    callback();
  });
}

module.exports = main;