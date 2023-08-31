const { blot_directory } = require("config");
const logFile = blot_directory + "/logs/app.log";
const lineReader = require("helper/lineReader");
const parse = require("./parse");
const moment = require("moment");
const fs = require("fs-extra");
const STATS_DIRECTORY = blot_directory + "/tmp/stats/node";

function main (logFile) {
  let currentMinute;
  let currentMinuteData = [];

  let currentMinuteCPU;
  let currentMinuteMemory;

  let currentHour;
  let currentHourData = [];

  return new Promise(resolve => {
    lineReader
      .eachLine(logFile, function (line) {
        try {
          // Handle the CPU and memory stats line separately
          // which look like:
          // [17/Aug/2023:00:12:00 +0000] [STATS] cpuuse=5.500% memuse=12.160%
          if (
            line.indexOf("] [STATS] cpuuse=") > -1 &&
            line.indexOf("memuse=")
          ) {
            currentMinuteCPU = parseFloat(
              line.slice(
                line.indexOf("cpuuse=") + "cpuuse=".length,
                line.indexOf("memuse=")
              )
            );
            currentMinuteMemory = parseFloat(
              line.slice(line.indexOf("memuse=") + "memuse=".length)
            );
          }

          // Handle a regular access log line
          // which look like:
          // [17/Aug/2023:00:01:15 +0000] eee62ff2faa671bfa089e63fd012f3f1 200 0.003 PID=16796 https://blot.im
          const {
            date,
            responseTime,
            status,
            workerPID,
            url,
            host,
            requestID
          } = parse(line);

          if (!currentMinute) currentMinute = date.format("YYYY-MM-DD-HH-mm");

          if (!currentHour) currentHour = date.format("YYYY-MM-DD-HH");

          if (date.format("YYYY-MM-DD-HH-mm") !== currentMinute) {
            currentMinute = date.format("YYYY-MM-DD-HH-mm");
            // we now need to calculate the averages for the previous minute

            const requestsByHost = currentMinuteData.reduce((acc, { host }) => {
              if (!acc[host]) acc[host] = 0;
              acc[host] += 1;
              return acc;
            }, {});

            const requestsByURL = currentMinuteData.reduce((acc, { url }) => {
              if (!acc[url]) acc[url] = 0;
              acc[url] += 1;
              return acc;
            }, {});

            // we calculate the median response time by sorting the response times
            // and then taking the middle value
            const medianResponseTime = currentMinuteData
              .slice()
              .sort((a, b) => a.responseTime - b.responseTime)[
              Math.floor(currentMinuteData.length / 2)
            ].responseTime;

            const slowestResponseTime = currentMinuteData
              .slice()
              .sort((a, b) => b.responseTime - a.responseTime)[0].responseTime;

            currentHourData.push({
              date: moment(currentMinute, "YYYY-MM-DD-HH-mm").valueOf(),
              cpu: currentMinuteCPU,
              memory: currentMinuteMemory,

              slowestRequests: currentMinuteData
                .slice()
                .sort((a, b) => b.responseTime - a.responseTime)
                .slice(0, 10)
                .map(({ responseTime, url, requestID }) => ({
                  responseTime,
                  url,
                  requestID
                })),

              slowestResponseTime,
              medianResponseTime,
              averageResponseTime:
                currentMinuteData.reduce((acc, { responseTime }) => {
                  return acc + responseTime;
                }, 0) / currentMinuteData.length,

              numberOfRequestsPerMinute: currentMinuteData.length,

              numberOfRequestsByWorker: currentMinuteData.reduce(
                (acc, { workerPID }) => {
                  if (!acc[workerPID]) acc[workerPID] = 0;
                  acc[workerPID] += 1;
                  return acc;
                },
                {}
              ),

              popularHosts: Object.keys(requestsByHost)
                .sort((a, b) => requestsByHost[b] - requestsByHost[a])
                .slice(0, 10)
                .map(host => ({ host, count: requestsByHost[host] })),

              popularURLs: Object.keys(requestsByURL)
                .sort((a, b) => requestsByURL[b] - requestsByURL[a])
                .slice(0, 10)
                .map(url => ({ url, count: requestsByURL[url] })),

              fractionOf4XXRequests:
                currentMinuteData.reduce((acc, { status }) => {
                  if (status >= 400 && status < 500) return acc + 1;
                  return acc;
                }, 0) / currentMinuteData.length,
              fractionOf5XXRequests:
                currentMinuteData.reduce((acc, { status }) => {
                  if (status >= 500 && status < 600) return acc + 1;
                  return acc;
                }, 0) / currentMinuteData.length
            });

            currentMinuteData = [];
            currentMinuteCPU = null;
            currentMinuteMemory = null;

            console.log("inserted", currentMinute);

            if (currentHour !== date.format("YYYY-MM-DD-HH")) {
              console.log("wrote", currentHour);
              fs.outputJSONSync(
                STATS_DIRECTORY + "/" + currentHour + ".json",
                currentHourData
              );
              currentHour = date.format("YYYY-MM-DD-HH");
              currentHourData = [];
            }
          } else {
            currentMinuteData.push({
              date,
              responseTime,
              status,
              workerPID,
              url,
              host,
              requestID
            });
          }
        } catch (e) {
          // there are other lines in the log file that we don't care about
        }

        return true;
      })
      .then(function () {
        // write the last hour
        fs.outputJSONSync(
          STATS_DIRECTORY + "/" + currentHour + ".json",
          currentHourData
        );

        resolve();
      });
  });
}

module.exports = main;

if (require.main === module) {
  // immediately invoked function expression (IIFE)

  (async function () {
    const data = await main(logFile);

    console.log(data);
    process.exit(0);
  })();
}
