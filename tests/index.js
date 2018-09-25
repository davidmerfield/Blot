var Jasmine = require("jasmine");
var jasmine = new Jasmine();
var config = {
  spec_dir: "",
  spec_files: ["tests/**/*.js", "app/**/tests/index.js", "app/**/tests.js"],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: false
};

// Pass in a custom test glob for running only specific tests
if (process.env.TEST) {
  config.spec_files = [
    process.env.TEST + "**/tests/index.js",
    process.env.TEST + "**/tests.js"
  ];
  console.log("Running tests from", config.spec_files);
}

jasmine.loadConfig(config);

global.createUser = require("./helpers/createUser");
global.createBlog = require("./helpers/createBlog");

global.removeBlog = require("./helpers/removeBlog");
global.removeUser = require("./helpers/removeUser");

jasmine.execute();
