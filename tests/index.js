var Jasmine = require("jasmine");
var jasmine = new Jasmine();
var colors = require('colors');
var seedrandom = require("seedrandom");
var seed;
var config = {
  spec_dir: "",
  spec_files: ["index.js", "**/tests/index.js", "**/tests.js"],
  helpers: ["tests/helpers/**/*.js"],
  stopSpecOnExpectationFailure: false,
  random: true
};

// Pass in a custom test glob for running only specific tests
if (process.argv[2]) {
  console.log("Running specs inside", colors.cyan(process.argv[2]));
  config.spec_dir = process.argv[2];
} else {
  console.log(
    'If you want to run tests from a subdirectory:', colors.cyan('npm test {path_to_specs}')
  );
}

if (process.argv[3]) {
  seed = process.argv[3];
} else {
  seed = Math.floor(Math.random() * 100000) + "";
  console.log(
    'If you want your own seed run "npm test {path_to_specs} {seed}"'
  );
}

seedrandom(seed, { global: true });
jasmine.seed(seed);
jasmine.loadConfig(config);

jasmine.addReporter({
  specStarted: function(result) {
    console.log();
    console.log(colors.dim(".. " + result.fullName));
  },
  specDone: function(result) {
    console.log(colors.dim(". " + result.fullName));
    console.log();
  }
});

global.createBlog = require("./util/createBlog");
global.removeBlog = require("./util/removeBlog");

global.createUser = require("./util/createUser");
global.removeUser = require("./util/removeUser");

jasmine.execute();
