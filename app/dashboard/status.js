var Express = require("express");
var status = Express.Router();
var redis = require("models/redis");

status.get("/", function (req, res) {
  var blogID = req.blog.id;
  var client = new redis();

  req.socket.setTimeout(2147483647);

  res.writeHead(200, {
    // This header tells NGINX to NOT
    // buffer the response. Otherwise
    // the messages don't make it to the client.
    // A similar problem to the one caused
    // by the compression middleware a few lines down.
    "X-Accel-Buffering": "no",
    "Content-Type": "text/event-stream",
    "Connection": "keep-alive",

    // the proxy cache ignores the Cache-Control header so we prevent its caching
    // with the header X-Accel-Expires: 0
    "Cache-Control": "no-cache",
    "X-Accel-Expires": "0"
  });

  res.write("\n");

  client.subscribe("sync:status:" + blogID);

  client.on("message", function (channel, message) {
    res.write("\n");
    res.write("data: " + message + "\n\n");
    res.flushHeaders();
  });

  // In case we encounter an error...print it out to the console
  client.on("error", function (err) {
    console.log("Redis Error: " + err);
  });

  // If the user closes the page, we stop sending events
  req.on("close", function () {
    console.log("Closing connection.");
    client.unsubscribe();
    client.quit();
    res.end();
  });
});

module.exports = status;
