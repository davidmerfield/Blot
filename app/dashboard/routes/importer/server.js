var Express = require("express");
var server = Express();
var app = require("./app");
var cons = require("consolidate");

server.engine("html", cons.mustache);
server.set("view engine", "html");
server.set("views", __dirname + "/app/views");

server.use(app);
server.listen(8088);
console.log("http://localhost:8088");
