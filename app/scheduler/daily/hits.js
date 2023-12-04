const fs = require("fs-extra");
const prettyNumber = require("helper/prettyNumber");
const { blot_directory } = require("config");

const stats_directory = blot_directory + "/data/stats";

// stats are stored in JSON arrays in files with the format '2023-11-29-20.json'
// where 20 is the hour of the day in UTC. we want to read all the files for the
// last 24 hours and average some of the values, and sum others.
// each file contains an array of 60 objects with the following properties,
// representing a minute of data:
// "date":1701237480000,
// "cpu":39.25,
// "memory":40.735,
// "slowestRequests":[],
// "slowestResponseTime":5.325,
// "medianResponseTime":0.029,
// "meanResponseTime":0.2983464566929135,
// "requests":254,
// "percent4XX":1.968503937007874,
// "percent5XX":0.7874015748031495

const stats_subdirectories = fs.readdirSync(stats_directory);

const properties_to_sum = ["requests", "bytesSent", "bytesReceived"];

const properties_to_average = [
  "medianResponseTime",
  "meanResponseTime",
  "memory",
  "cpu",
  "percent4XX",
  "percent5XX",

  // redis
  "connected_clients",
  "cpu_load"
];

const properties_to_return_most_recent = [
  "root_disk_used",
  "root_disk_free",
  "backup_disk_free",
  "backup_disk_used",
  "system_memory",
  "used_memory"
];

function main (callback) {
  const files = fs
    .readdirSync(stats_directory + "/node")
    .filter(file => file.endsWith(".json"))
    .sort()
    .slice(-24)
    .reverse();

  const response = {};

  for (let x = 0; x < stats_subdirectories.length; x++) {
    const subdirectory = stats_subdirectories[x];
    const aggregate = (response[subdirectory] = {});

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const stats = JSON.parse(
        fs.readFileSync(
          stats_directory + "/" + subdirectory + "/" + file,
          "utf8"
        )
      ).reverse();

      for (let j = 0; j < stats.length; j++) {
        const stat = stats[j];

        for (let k = 0; k < properties_to_sum.length; k++) {
          const property = properties_to_sum[k];
          if (stat[property] === undefined) continue;

          if (!aggregate[property]) aggregate[property] = 0;
          aggregate[property] += stat[property];
        }

        for (let k = 0; k < properties_to_average.length; k++) {
          const property = properties_to_average[k];
          if (stat[property] === undefined) continue;

          if (!aggregate[property]) aggregate[property] = [];
          aggregate[property].push(stat[property]);
        }

        for (let k = 0; k < properties_to_return_most_recent.length; k++) {
          const property = properties_to_return_most_recent[k];
          if (stat[property] === undefined) continue;
          if (aggregate[property] === undefined)
            aggregate[property] = stat[property];
        }
      }
    }

    // average the properties that need to be averaged
    for (let i = 0; i < properties_to_average.length; i++) {
      const property = properties_to_average[i];
      if (!aggregate[property]) continue;
      const average =
        aggregate[property].reduce((a, b) => a + b) /
        aggregate[property].length;

      aggregate[property] = average;
    }

    response.requests = prettyNumber(response.requests);
  }

  return callback(null, response);
}

module.exports = main;

if (require.main === module) require("./cli")(main);
