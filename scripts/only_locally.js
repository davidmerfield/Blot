var config = require("../config");

if (config.environment !== "development")
  throw "This script must only be run locally.";

if (
  __dirname.toLowerCase() !==
  require("helper/rootDir").toLowerCase() + "/scripts"
)
  throw "This script must only be run locally.";
