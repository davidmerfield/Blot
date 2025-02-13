const clfdate = require("helper/clfdate");

let unrespondedRequests = [];

setInterval(function () {
  console.log(
    clfdate(),
    "PID=" + process.pid,
    "PENDING=" + unrespondedRequests.length,
    unrespondedRequests.join(", ")
  );
}, 1000 * 15); // 15 seconds

module.exports = function (req, res, next) {
    var init = Date.now();
  
    try {
      if (req.headers["x-request-id"])
        unrespondedRequests.push(req.headers["x-request-id"].slice(0, 8));
  
      console.log(
        clfdate(),
        req.headers["x-request-id"] ? req.headers["x-request-id"] : "no-request-id",
        "PID=" + process.pid,
        req.protocol + "://" + req.hostname + req.originalUrl,
        req.method
      );
    } catch (e) {
      console.error("Error: Failed to construct canonical log line:", e);
    }
  
    // add method req.log which exposes a logging function prefixed with the request id, clfdate, and time in ms between each invocation
    let lastLogTime = Date.now();
    req.log = function () {
      let args = Array.prototype.slice.call(arguments);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastLogTime;
      lastLogTime = currentTime;
  
      args.unshift(`+${timeDiff}ms`);
  
      if (req.headers["x-request-id"]) {
        args.unshift(req.headers["x-request-id"]);
      } else {
        args.unshift("no-request-id");
      }
      args.unshift(clfdate());
      console.log.apply(console, args);
    };
  
    let hasFinished = false;
    res.on("finish", function () {
      hasFinished = true;
      try {
        if (req.headers["x-request-id"])
          unrespondedRequests = unrespondedRequests.filter(
            id => id !== req.headers["x-request-id"].slice(0, 8)
          );
        console.log(
          clfdate(),
          req.headers["x-request-id"] && req.headers["x-request-id"],
          res.statusCode,
          ((Date.now() - init) / 1000).toFixed(3),
          "PID=" + process.pid,
          req.protocol + "://" + req.hostname + req.originalUrl
        );
      } catch (e) {
        console.error("Error: Failed to construct canonical log line:", e);
      }
    });
  
    req.on("close", function () {
      if (hasFinished) return;
      try {
        if (req.headers["x-request-id"])
          unrespondedRequests = unrespondedRequests.filter(
            id => id !== req.headers["x-request-id"].slice(0, 8)
          );
        console.log(
          clfdate(),
          req.headers["x-request-id"] && req.headers["x-request-id"],
          "Connection closed by client",
          "PID=" + process.pid,
          req.protocol + "://" + req.hostname + req.originalUrl
        );
      } catch (e) {
        console.error("Error: Failed to construct canonical log line:", e);
      }
    });
  
    next();
  }