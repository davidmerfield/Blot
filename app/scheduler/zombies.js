const config = require("config");
const exec = require("child_process").exec;
const email = require("helper/email");
const async = require("async");
const clfdate = require("helper/clfdate");

if (require.main === module) {
  main(function (err) {
    if (err) throw err;
    process.exit();
  });
}

function main(callback) {
  const prefix = () => clfdate() + " Zombies:";

  console.log(prefix(), "checking");

  // We determine zombies processes as commands invoked with node
  // on something within Blot's directory, e.g. node app whose
  // process parent ID is the OS (i.e. ppid = 1). This usually
  // happens when the process becomes detached, i.e. a zombie.
  // I want to investigate and remove the causes of these.
  exec(
    `ps -e -o ppid= -o pid= -o command= | grep "node ${config.blot_directory}" | awk '$1 == "1" { print $2 }'`,
    function (err, stdout) {
      if (err) return callback(err);

      const zombie_pids = stdout.split("\n").filter((i) => !!i);

      if (zombie_pids.length) {
        console.log(prefix(), `${zombie_pids.length} zombies found`);
        email.ZOMBIE_PROCESS();
      } else {
        console.log(prefix(), `none found`);
      }

      async.eachSeries(
        zombie_pids,
        (pid, next) => {
          console.log(prefix(), "killing pid =", pid);
          exec(`kill ${pid}`, function (err, stdout) {
            if (err) {
              console.log(prefix(), "error killing pid =", pid, err);
              next(err);
            } else {
              console.log(prefix(), "killed pid =", pid, "stdout =", stdout);
              next();
            }
          });
        },
        callback
      );
    }
  );
}

module.exports = main;
