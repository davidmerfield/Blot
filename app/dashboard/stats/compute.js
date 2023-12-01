const fs = require("fs-extra");
const { blot_directory } = require("config");

async function handle ({ logFileName, aggregator }) {
  // the most recent logfile is stored
  // in blot_directory + "/data/logs/app.log"
  // previous logfiles are stored in directories with the format
  // blot_directory + "/data/logs/archive-YYYY-MM-DD-ec2-user/app.log"
  // where YYYY-MM-DD is the date of the logfile
  // and ec2-user is the user that ran the blot process

  // we should first process the most recent logfile
  // then iterate over the archive directories in reverse chronological order

  const logFiles = [blot_directory + "/data/logs/" + logFileName].concat(
    fs
      .readdirSync(blot_directory + "/data/logs")
      .filter(file => file.indexOf("archive-") > -1)
      .sort()
      .reverse()
      .map(file => blot_directory + "/data/logs/" + file + "/" + logFileName)
      .filter(file => fs.existsSync(file))
  );

  for (let i = 0; i < logFiles.length; i++) {
    console.log(logFileName, logFiles[i], "computing...");
    const { reComputed } = await aggregator(logFiles[i]);
    if (reComputed) {
      console.log(
        logFileName,
        logFiles[i],
        "computed up to already-computed data"
      );
      break;
    } else {
      console.log(logFileName, logFiles[i], "computed");
    }
  }

  console.log(logFileName, "done");
}

async function main ({ reset = false }) {
  if (reset) {
    console.log("resetting stats");
    await fs.emptyDir();
    console.log("reset stats, now recomputing...");
  }
  await Promise.all([
    handle({ logFileName: "app.log", aggregator: require("./node") }),
    handle({
      logFileName: "access.log",
      aggregator: require("./nginx-access")
    }),
    require("./redis")
  ]);
}

module.exports = main;

if (require.main === module) {
  (async function () {
    await main({ reset: process.argv[2] === "--reset" });
    if (!process.argv[2]) {
      console.log("please specify --reset to reset stats");
    }
  })();
}
