var cluster = require("cluster");

if (cluster.isMaster) {
  // Forking Worker1 and Worker2
  var worker1 = cluster.fork({ kind: "server" });
  var worker2 = cluster.fork({ kind: "server" });
  var worker3 = cluster.fork({ kind: "sync" });

  // Respawn if one of both exits
  cluster.on("exit", function (worker) {
    if (worker === worker1) worker1 = cluster.fork({ kind: "server" });
    if (worker === worker2) worker2 = cluster.fork({ kind: "server" });
    if (worker === worker3) worker3 = cluster.fork({ kind: "sync" });
  });
} else {
  if (process.env.kind === "server") {
    require("./server").listen(8812, function () {
      console.log(`Server process listening pid=${process.pid} port=8812`);
    });
  } else if (process.env.kind === "sync") {
    require("./sync");
  } else if (process.env.kind === "build") {
    require("./build");
  } else {
    throw new Error("Unexpected worker kind=", process.env.kind);
  }
}
