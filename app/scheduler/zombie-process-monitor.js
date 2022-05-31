const config = require("config");
const email = require("helper/email");
const exec = require("child_process").exec;

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    process.exit();
  });
}

function main(callback) {
  exec(
    `ps -e -o ppid= -o pid= -o command= | grep "node ${config.blot_directory}" | awk '$1 == "1" { print $2 }'`,
    function (err, stdout) {
      if (err) return callback(err);

      console.log('result', stdout.split('\n'));

      // if (config.environment === "development") {
      //   // this is annoying in development
      // } else {
      //   console.log(clfdate(), "[STATS]", "top");
      //   console.log(stdout);
      // }

      callback();
    }
  );
}

module.exports = main;
