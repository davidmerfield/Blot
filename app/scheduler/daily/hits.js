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

const properties_to_sum = ["requests"];

const properties_to_average = [
  "medianResponseTime",
  "meanResponseTime",
  "memory",
  "cpu",
  "percent4XX",
  "percent5XX"
];

function main (callback) {
  const files = fs
    .readdirSync(stats_directory + "/node")
    .sort()
    .slice(-24);

  console.log("reading", files);

  const response = {};

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stats = JSON.parse(
      fs.readFileSync(stats_directory + "/node/" + file, "utf8")
    );

    for (let j = 0; j < stats.length; j++) {
      const stat = stats[j];

      for (let k = 0; k < properties_to_sum.length; k++) {
        const property = properties_to_sum[k];
        if (!response[property]) response[property] = 0;
        response[property] += stat[property];
      }

      for (let k = 0; k < properties_to_average.length; k++) {
        const property = properties_to_average[k];
        if (!response[property]) response[property] = [];
        response[property].push(stat[property]);
      }
    }
  }

  // average the properties that need to be averaged
  for (let i = 0; i < properties_to_average.length; i++) {
    const property = properties_to_average[i];
    const average =
      response[property].reduce((a, b) => a + b) / response[property].length;

    response[property] = average;
  }

  response.requests = prettyNumber(response.requests);

  return callback(null, response);
}

module.exports = main;

if (require.main === module) require("./cli")(main);
