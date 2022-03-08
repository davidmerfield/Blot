const redis = require("ioredis");
const config = require("config");

module.exports = function (channel) {
  return function (req, res) {
    var client = new redis(config.redis.port);
    var CHANNEL = channel(req);

    req.socket.setTimeout(2147483647);
    res.writeHead(200, {
      "X-Accel-Buffering": "no",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    res.write("\n");

    client.subscribe(CHANNEL);

    client.on("message", function (_channel, message) {
      if (_channel !== CHANNEL) return;
      res.write("\n");
      res.write("data: " + message + "\n\n");
      res.flush();
    });

    client.on("error", function (err) {
      console.error(err);
      res.socket.destroy();
    });

    req.on("close", function () {
      client.unsubscribe();
      client.quit();
    });
  };
};
