if (process.env.FAST !== "true") {
  module.exports = require("./forked");
} else {
  module.exports = require("./main");
}
