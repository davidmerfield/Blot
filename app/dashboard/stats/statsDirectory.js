const { blot_directory } = require("config");
const { join } = require("path");
module.exports = join(blot_directory, "/data/stats");
