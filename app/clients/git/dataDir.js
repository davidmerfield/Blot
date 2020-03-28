require("fs-extra").ensureDirSync(__dirname + "/data");

// consolidated reference to location of bareRepoDirectory in
// tests and code so we can move this in future painlessly:
// basically look for '/data'

module.exports = __dirname + "/data";
