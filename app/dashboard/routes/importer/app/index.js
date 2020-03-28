console.log("TODO: channel needs to be identified by blogID!");
var CHANNEL = "channel:123";

var Express = require("express");
var app = Express.Router();
var bodyParser = require("body-parser").urlencoded({ extended: false });
var redis = require("redis");

app.get("/stream", function(req, res) {
  // Eventually identify this by request BLOGID
  var channel = CHANNEL;
  var client = redis.createClient();

  req.socket.setTimeout(Number.MAX_VALUE);

  // Headers which tell NGINX to NOT buffer the
  // response, prevent it from being cached or
  // otherwise modified by other middleware.
  res.writeHead(200, {
    "X-Accel-Buffering": "no",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  res.write("\n");

  client.subscribe(channel);

  client.on("message", function(_channel) {
    if (_channel !== channel) return;

    res.write("\n");
    res.write("data: " + "MESSAGE!" + "\n\n");
    res.flush();
  });

  client.on("error", function(err) {
    client.unsubscribe();
    client.quit();
    res.end();
  });

  req.on("close", function() {
    client.unsubscribe();
    client.quit();
  });
});

app.get("/", function(req, res) {
  res.locals.importers = [
    { slug: "postache", title: "Postache" },
    { slug: "tumblr", title: "Tumblr" },
    { slug: "jekyll", title: "Jekyll" },
    { slug: "wordpress", title: "Wordpress" },
    { slug: "squarespace", title: "Squarespace", last: true }
  ];
  res.render("index");
});

app.post("/new", bodyParser, function(req, res) {
  console.log(req.body);
  var channel = CHANNEL;
  var client = redis.createClient();
  client.publish(channel, req.body.link);
  client.lpush(channel, req.body.link);
  res.redirect("/");
});

module.exports = app;
