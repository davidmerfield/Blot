var config = require("config");

// Don't use a leading slash or listObjects will not work
// properly, although upload will.

if (config.environment === "development") {
  module.exports = "_dev/";
} else {
  module.exports = "";
}
