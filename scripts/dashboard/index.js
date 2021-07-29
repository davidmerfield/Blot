var blessed;
var contrib;

try {
  blessed = require("blessed");
  contrib = require("blessed-contrib");
} catch (e) {
  console.log(e);
  console.log("Try running npm ci --also=dev");
  return;
}

const Tail = require("../../app/helper/tail");
var screen = blessed.screen();
//create layout and widgets
var grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

/**
 * Donut Options
  self.options.radius = options.radius || 14; // how wide is it? over 5 is best
  self.options.arcWidth = options.arcWidth || 4; //width of the donut
  self.options.yPadding = options.yPadding || 2; //padding from the top
 */

var execSync = require("child_process").execSync;

const calcDisk = () => {
  const diskOut = execSync("df -k").toString();
  let disk = diskOut.split("\n")[1].replace(/\s+/g, " ").split(" ");
  const usage = parseInt(disk[2]);
  const available = parseInt(disk[3]);
  const total = usage + available;
  let pct = ((usage / total) * 100).toFixed(2);
  return pct;
};

var diskDonut = grid.set(0, 10, 3, 2, contrib.donut, {
  label: "Disk space",
  radius: 10,
  arcWidth: 4,
  yPadding: 2,
  data: [{ label: "used / total", percent: calcDisk() }],
});

function updateDiskSpace() {
  var pct = calcDisk();
  var color = "green";
  if (pct >= 25) color = "cyan";
  if (pct >= 50) color = "yellow";
  if (pct >= 75) color = "red";
  diskDonut.setData([
    {
      percent: pct,
      label: "used / total",
      color: color,
    },
  ]);
}

setInterval(updateDiskSpace, 1000);

const os = require("os");

const calcMem = () => {
  let totalmem = os.totalmem();
  let freemem = os.freemem();
  let pct = (((totalmem - freemem) / totalmem) * 100).toFixed(2);
  return pct;
};

var donut = grid.set(0, 8, 3, 2, contrib.donut, {
  label: "Memory",
  radius: 10,
  arcWidth: 4,
  yPadding: 2,
  data: [{ label: "used / total", percent: calcMem() }],
});

function updateMemoryUsage() {
  var pct = calcMem();
  var color = "green";
  if (pct >= 25) color = "cyan";
  if (pct >= 50) color = "yellow";
  if (pct >= 75) color = "red";
  donut.setData([
    {
      percent: pct,
      label: "used / total",
      color: color,
    },
  ]);
}
setInterval(updateMemoryUsage, 1500);

const calcCPU = () => {
  let loadavg = os.loadavg()[0];
  let totalCPUs = os.cpus().length;
  let pct = ((loadavg / totalCPUs) * 100).toFixed(2);
  return pct;
};

var cpuDonut = grid.set(0, 6, 3, 2, contrib.donut, {
  label: "CPU",
  radius: 10,
  arcWidth: 4,
  yPadding: 2,
  data: [{ label: "load / num cpu", percent: calcCPU() }],
});

function updateCPUUsage() {
  var pct = calcCPU();
  var color = "green";
  if (pct >= 25) color = "cyan";
  if (pct >= 50) color = "yellow";
  if (pct >= 75) color = "red";
  cpuDonut.setData([
    {
      percent: pct,
      label: "load / num cpu",
      color: color,
    },
  ]);
}

setInterval(updateCPUUsage, 1500);

// var latencyLine = grid.set(8, 8, 4, 2, contrib.line,
//   { style:
//     { line: "yellow"
//     , text: "green"
//     , baseline: "black"}
//   , xLabelPadding: 3
//   , xPadding: 5
//   , label: 'Network Latency (sec)'})

// var gauge = grid.set(2, 9, 2, 3, contrib.gauge, {
//   label: "Cached requests",
//   percent: [80, 20],
// });

// var gauge_two = grid.set(2, 9, 2, 3, contrib.gauge, {
//   label: "Deployment Progress",
//   percent: 80,
// });

var sparkline = grid.set(3, 6, 3, 3, contrib.sparkline, {
  label: "Throughput (bits/sec)",
  tags: true,
  style: { fg: "blue", titleFg: "white" },
});

// var bar = grid.set(0, 9, 2, 3, contrib.bar, {
//   label: "Server Utilization (%)",
//   barWidth: 4,
//   barSpacing: 6,
//   xOffset: 2,
//   maxHeight: 9,
// });

var table = grid.set(3, 9, 3, 3, contrib.table, {
  keys: false,
  interactive: false,
  fg: "green",
  label: "Syncing blogs",
  columnSpacing: 1,
  columnWidth: [100],
});

/*
 *
 * LCD Options
//these options need to be modified epending on the resulting positioning/size
  options.segmentWidth = options.segmentWidth || 0.06; // how wide are the segments in % so 50% = 0.5
  options.segmentInterval = options.segmentInterval || 0.11; // spacing between the segments in % so 50% = 0.5
  options.strokeWidth = options.strokeWidth || 0.11; // spacing between the segments in % so 50% = 0.5
//default display settings
  options.elements = options.elements || 3; // how many elements in the display. or how many characters can be displayed.
  options.display = options.display || 321; // what should be displayed before anything is set
  options.elementSpacing = options.spacing || 4; // spacing between each element
  options.elementPadding = options.padding || 2; // how far away from the edges to put the elements
//coloring
  options.color = options.color || "white";
*/

// var errorsLine = grid.set(0, 6, 4, 3, contrib.line, {
//   style: { line: "red", text: "white", baseline: "black" },
//   label: "Errors Rate",
//   maxY: 60,
//   showLegend: true,
// });

var transactionsLine = grid.set(0, 0, 6, 6, contrib.line, {
  showNthLabel: 5,
  label: "Requests per second",
  showLegend: false,
  legend: { width: 10 },
});

var log = grid.set(6, 0, 3, 12, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: "NGINX Log",
});

var appLog = grid.set(9, 0, 3, 12, contrib.log, {
  fg: "green",
  selectedFg: "green",
  label: "App Log",
});

//dummy data
var servers = ["US1", "US2", "EU1", "AU1", "AS1", "JP1"];
var commands = [
  "grep",
  "node",
  "java",
  "timer",
  "~/ls -l",
  "netns",
  "watchdog",
  "gulp",
  "tar -xvf",
  "awk",
  "npm install",
];

//set dummy data on gauge
// var gauge_percent = 0;
// setInterval(function () {
//   gauge.setData([gauge_percent, 100 - gauge_percent]);
//   gauge_percent++;
//   if (gauge_percent >= 100) gauge_percent = 0;
// }, 200);

//set dummy data on bar chart
// function fillBar() {
//   var arr = [];
//   for (var i = 0; i < servers.length; i++) {
//     arr.push(Math.round(Math.random() * 10));
//   }
//   bar.setData({ titles: servers, data: arr });
// }
// fillBar();
// setInterval(fillBar, 2000);

var tableData = [];

function updateSyncs(data) {
  // [20/Apr/2021:21:58:11 +0000] blog_483b45b sync_46fc6cc Finished
  // [20/Apr/2021:21:58:12 +0000] blog_483b45b sync_95d46ef Started

  if (data.indexOf(" blog_") > -1 && data.indexOf(" sync_") > -1) {
    let blogID = data.slice(data.indexOf("blog_"), data.indexOf(" sync_"));
    let syncID = data.slice(data.indexOf("sync_"), data.indexOf("sync_") + 14);

    if (data.indexOf(" Finished") > -1) {
      tableData = tableData.filter((row) => row[0] !== blogID);
    }
    if (data.indexOf(" Started") > -1) {
      tableData.push([blogID]);
    }

    table.setData({ headers: ["BlogID"], data: tableData });
  }
}

table.setData({ headers: ["BlogID"], data: tableData });

const tail = new Tail("logs/nginx.log", { nLines: 100 });

tail.on("line", function (data) {
  updateReqPerSecond(data);
  updateLog(data);
  updateThroughput(data);
});

function updateLog(data) {
  const date = data.slice(1, data.indexOf("]"));
  data = data.slice(data.indexOf("]") + 2).split(" ");
  const req_id = data[0];
  const status = data[1];
  const responsetime = data[2];
  const ratio = data[3];
  const url = data[4];
  const cache = data[5];
  const line = status + " " + req_id.slice(0, 6) + " " + url;
  log.log(line);
  screen.render();
}

const tailApp = new Tail("logs/app.log", { nLines: 100 });

tailApp.on("line", function (data) {
  updateSyncs(data);

  let line;
  // has the clfdate at start: [19/Apr/2021:20:28:00 -0400]
  if (data.indexOf("[") === 0 && data.indexOf("]") === 27) {
    //[19/Apr/2021:20:28:00 -0400] 6b4ff6cbc4de2a240424aba029ab5030 PID=76005 https://blot.development/log-in?then=/settings/client/git GET
    if (data.split(" ")[3].indexOf("PID=") === 0) {
      line = data.split(" ")[5] + " " + data.split(" ")[4];
      //[19/Apr/2021:20:28:00 -0400] 6b4ff6cbc4de2a240424aba029ab5030 429 0.003 PID=76005 https://blot.development/log-in?then=/settings/client/git
    } else {
      line =
        data.split(" ")[3] +
        " " +
        data.split(" ")[4] +
        " " +
        data.split(" ")[6];
    }
  } else {
    line = data;
  }

  appLog.log(line);
  screen.render();
});

var received = [];
var sent = [];

var currentThroughputSecond;
var responseDataSentInCurrentSecond = 0;
var requestDataReceievedInCurrentSecond = 0;

function updateThroughput(data) {
  const date = data.slice(1, data.indexOf("]"));

  let second = moment(date, "DD/MMM/YYYY:HH:mm:ss Z")
    .startOf("second")
    .format("mm:ss");

  const requestDataReceived = parseInt(data.split(" ")[5].split(":")[0]);
  const responseDataSent = parseInt(data.split(" ")[5].split(":")[1]);

  if (currentThroughputSecond === undefined) {
    currentThroughputSecond = second;
  }

  if (second === currentThroughputSecond) {
    responseDataSentInCurrentSecond += responseDataSent;
    requestDataReceievedInCurrentSecond += requestDataReceived;
  } else {
    sent.push(responseDataSentInCurrentSecond);
    received.push(requestDataReceievedInCurrentSecond);
    currentThroughputSecond = second;

    responseDataSentInCurrentSecond = 0;
    requestDataReceievedInCurrentSecond = 0;

    if (sent.length > 30) sent = sent.slice(-1 * 30);

    if (received.length > 30) received = received.slice(-1 * 30);

    sparkline.setData(["Received", "Sent"], [received, sent]);
  }
}

const moment = require("moment");

// [17/Apr/2021:15:20:09 -0400] 4c071011176edb096b3461d2bd9a40f1 502 0.001 888:1220 https://blot.development/settings/photo  cache=-
var currentSecond;
var currentSecondReqs = 0;
var transactionsData = {
  title: "NGINX",
  style: { line: "red" },
  x: [],
  y: [],
};

function updateReqPerSecond(data) {
  const date = data.slice(1, data.indexOf("]"));

  let second = moment(date, "DD/MMM/YYYY:HH:mm:ss Z")
    .startOf("second")
    .format("mm:ss");

  if (currentSecond === undefined) {
    currentSecond = second;
  }

  if (second === currentSecond) {
    currentSecondReqs++;
  } else {
    transactionsData.x.push(currentSecond);
    transactionsData.y.push(currentSecondReqs);
    currentSecond = second;
    currentSecondReqs = 1;
    if (transactionsData.x.length > 30)
      transactionsData.x = transactionsData.x.slice(-1 * 30);
    if (transactionsData.y.length > 30)
      transactionsData.y = transactionsData.y.slice(-1 * 30);
  }
}

var errorsData = {
  title: "server 1",
  x: ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25"],
  y: [30, 50, 70, 40, 50, 20],
};

var latencyData = {
  x: ["t1", "t2", "t3", "t4"],
  y: [5, 1, 7, 5],
};

transactionsLine.setData(transactionsData);
// setLineData([errorsData], errorsLine);
// setLineData([latencyData], latencyLine)

setInterval(function () {
  transactionsLine.setData(transactionsData);
  screen.render();
}, 1000);

// setInterval(function () {
//   setLineData([errorsData], errorsLine);
// }, 1500);

setInterval(function () {
  updateMemoryUsage();
  screen.render();
}, 500);

screen.key(["escape", "q", "C-c"], function (ch, key) {
  return process.exit(0);
});

// fixes https://github.com/yaronn/blessed-contrib/issues/10
screen.on("resize", function () {
  donut.emit("attach");
  sparkline.emit("attach");
  table.emit("attach");
  transactionsLine.emit("attach");
  log.emit("attach");
});

screen.render();
