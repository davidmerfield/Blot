const Tail = require("../app/helper/tail");
const tail = new Tail("logs/nginx.log", { nLines: 1000 });
const request = require("request");

const urls = [];

tail.on("line", function (data) {
  const url = data.split(" ").slice(-3, -2).pop();
  if (urls.indexOf(url) === -1) urls.push(url);
});

function randomReq(cb) {
  console.log("making request...");
  if (urls.length === 0) return cb();
  const url = urls[Math.floor(Math.random() * urls.length)];
  if (!url) return cb();
  request(url, { rejectUnauthorized: false }, cb);
}

randomReq(function wait() {
  console.log("waiting to make request...");
  setTimeout(randomReq.bind(null, wait), Math.random() * 100);
});
