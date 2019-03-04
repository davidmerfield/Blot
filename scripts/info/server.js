var blessed = require("blessed");
var contrib = require("blessed-contrib");

var screen = blessed.screen();
var grid = new contrib.grid({ rows: 2, cols: 2, screen: screen });

var line = grid.set(0, 0, 1, 1, contrib.line, {
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  label: "Response time"
});

var lineData = {
  x: ["t1", "t2", "t3", "t4"],
  y: [5, 1, 7, 5]
};

line.setData([lineData]);

var spark = grid.set(1, 0, 1, 2, contrib.sparkline, {
  label: "Throughput (bits/sec)",
  tags: true,
  style: { fg: "blue" }
});


var sparkOneData = [10, 20, 30, 20];
var sparkTwoData = [40, 10, 40, 50];

spark.setData(
  ["Sparkline1", "Sparkline2"],
  [sparkOneData, sparkTwoData]
);

setInterval(function() {

  sparkOneData.push(Math.random() * 50);
  sparkTwoData.push(Math.random() * 50);

  spark.setData(
    ["Sparkline1", "Sparkline2"],
    [sparkOneData, sparkTwoData]
  );

  screen.render()
}, 1000);

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

screen.render();
