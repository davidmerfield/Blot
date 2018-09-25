var Jasmine = require("jasmine");
var jasmine = new Jasmine();

var config = {
  spec_dir: "",
  spec_files: ["**/tests/index.js", "**/tests.js"],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: true
};

// Pass in a custom test glob for running only specific tests
if (process.argv[2]) {
  console.log('Running specs inside', process.argv[2]);
  config.spec_dir = process.argv[2];
} else {
  console.log('If you want to run tests from a subdirectory: "npm test {path_to_specs}"');
}

if (process.argv[3]) {
  jasmine.seed(process.argv[3]);
} else {
  console.log('If you want your own seed run "npm test {path_to_specs} {seed}"');
}

beforeAll(function(done){
console.log('Is this fun?');
done();
});

jasmine.loadConfig(config);
jasmine.execute();