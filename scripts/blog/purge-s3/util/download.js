var request = require("request");
var fs = require("fs-extra");
var dirname = require("path").dirname;

module.exports = function download(url, path, callback) {
  fs.ensureDirSync(dirname(path));

  if (url[0] === "/" && url[1] === "/") {
    url = "https:" + url;
  }

  var ws = fs.createWriteStream(path);

  ws.on("close", function() {
    if (!fs.existsSync(path) || !fs.statSync(path).size) {
      callback(new Error("Failed to download: " + url + " to " + path));
    } else {
      callback();
    }
  });

  ws.on("error", callback);

  request
    .get({ uri: url, timeout: 5000 })
    .on("error", callback)
    .pipe(ws);
};
