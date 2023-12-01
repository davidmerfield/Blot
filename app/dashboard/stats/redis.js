const moment = require("moment");
const fs = require("fs-extra");
const STATS_DIRECTORY = require("./statsDirectory") + "/redis";
const client = require("models/client");

async function main () {
  const stats = await getAllStats();

  let hour;
  let hourData = [];
  let hourPath = STATS_DIRECTORY + "/" + hour + ".json";

  for (let i = 0; i < stats.length; i++) {
    const minute = date.format("YYYY-MM-DD-HH-mm");
    const minuteData = {
      ...stat,
      date: moment(minute, "YYYY-MM-DD-HH-mm").valueOf()
    };
    const minutePath = STATS_DIRECTORY + "/" + minute + ".json";

    const stat = stats[i];
    const date = moment(stat.timestamp * 1000);

    // initialize the current minute and hour
    if (!hour) hour = date.format("YYYY-MM-DD-HH");

    // write this minute
    await fs.outputJSON(minutePath, minuteData);

    hourData.push(minuteData);

    // we are in a new hour
    if (hour !== date.format("YYYY-MM-DD-HH")) {
      // write the last hour if and only if we have gathered more minutes than those already written
      const existingHourLength =
        ((await fs.exists(hourPath)) && (await fs.readJSON(hourPath)).length) ||
        0;

      console.log(
        "existingHourLength",
        existingHourLength,
        "hourData.length",
        hourData.length
      );

      if (hourData.length > existingHourLength) {
        console.log("writing hour", hourPath);
        await fs.outputJSON(hourPath, hourData);
      }

      hourData = [];
    }
  }
}

async function getAllStats () {
  return new Promise((resolve, reject) => {
    const key = "blot:stats";
    client.lrange(key, 0, -1, (err, data) => {
      if (err) reject(err);
      resolve(data.map(JSON.parse).reverse());
    });
  });
}

if (require.main === module) {
  main().catch(console.log);
}

module.exports = main;
