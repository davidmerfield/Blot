var blessed = require("blessed");
var contrib = require("blessed-contrib");
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
  label: "Active syncs",
  columnSpacing: 1,
  columnWidth: [24, 10],
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
  maxY: 100,
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

//set dummy data for table
function generateTable() {
  var data = [];

  for (var i = 0; i < 30; i++) {
    var row = [];
    row.push(commands[Math.round(Math.random() * (commands.length - 1))]);
    row.push(Math.round(Math.random() * 5));
    data.push(row);
  }

  table.setData({ headers: ["BlogID", "URL"], data: data });
}

generateTable();
setInterval(generateTable, 3000);

const tail = new Tail("logs/nginx.log", { nLines: 100 });

tail.on("line", function (data) {
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
});

const tailApp = new Tail("logs/app.log", { nLines: 100 });

tailApp.on("line", function (data) {
  appLog.log(data);
  screen.render();
});

//set spark dummy data
var spark1 = [
  1,
  2,
  5,
  2,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  4,
  4,
  5,
  4,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
];
var spark2 = [
  4,
  4,
  5,
  4,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  4,
  4,
  5,
  4,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
  1,
  2,
  5,
  2,
  1,
  5,
];

refreshSpark();
setInterval(refreshSpark, 1000);

function refreshSpark() {
  spark1.shift();
  spark1.push(Math.random() * 5 + 1);
  sparkline.setData(["Received", "Sent"], [spark1, spark1]);
}

//set line charts dummy data

var transactionsData = {
  title: "USA",
  style: { line: "red" },
  x: [
    "00:00",
    "00:05",
    "00:10",
    "00:15",
    "00:20",
    "00:30",
    "00:40",
    "00:50",
    "01:00",
    "01:10",
    "01:20",
    "01:30",
    "01:40",
    "01:50",
    "02:00",
    "02:10",
    "02:20",
    "02:30",
    "02:40",
    "02:50",
    "03:00",
    "03:10",
    "03:20",
    "03:30",
    "03:40",
    "03:50",
    "04:00",
    "04:10",
    "04:20",
    "04:30",
  ],
  y: [
    0,
    20,
    40,
    45,
    45,
    50,
    55,
    70,
    65,
    58,
    50,
    55,
    60,
    65,
    70,
    80,
    70,
    50,
    40,
    50,
    60,
    70,
    82,
    88,
    89,
    89,
    89,
    80,
    72,
    70,
  ],
};

var transactionsData1 = {
  title: "Europe",
  style: { line: "yellow" },
  x: [
    "00:00",
    "00:05",
    "00:10",
    "00:15",
    "00:20",
    "00:30",
    "00:40",
    "00:50",
    "01:00",
    "01:10",
    "01:20",
    "01:30",
    "01:40",
    "01:50",
    "02:00",
    "02:10",
    "02:20",
    "02:30",
    "02:40",
    "02:50",
    "03:00",
    "03:10",
    "03:20",
    "03:30",
    "03:40",
    "03:50",
    "04:00",
    "04:10",
    "04:20",
    "04:30",
  ],
  y: [
    0,
    5,
    5,
    10,
    10,
    15,
    20,
    30,
    25,
    30,
    30,
    20,
    20,
    30,
    30,
    20,
    15,
    15,
    19,
    25,
    30,
    25,
    25,
    20,
    25,
    30,
    35,
    35,
    30,
    30,
  ],
};

var errorsData = {
  title: "server 1",
  x: ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25"],
  y: [30, 50, 70, 40, 50, 20],
};

var latencyData = {
  x: ["t1", "t2", "t3", "t4"],
  y: [5, 1, 7, 5],
};

setLineData([transactionsData, transactionsData1], transactionsLine);
// setLineData([errorsData], errorsLine);
// setLineData([latencyData], latencyLine)

setInterval(function () {
  setLineData([transactionsData, transactionsData1], transactionsLine);
  screen.render();
}, 500);

// setInterval(function () {
//   setLineData([errorsData], errorsLine);
// }, 1500);

setInterval(function () {
  updateMemoryUsage();
  screen.render();
}, 500);

function setLineData(mockData, line) {
  for (var i = 0; i < mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length - 1];
    mockData[i].y.shift();
    var num = Math.max(last + Math.round(Math.random() * 10) - 5, 10);
    mockData[i].y.push(num);
  }

  line.setData(mockData);
}

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
