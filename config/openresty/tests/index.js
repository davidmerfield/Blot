const Jasmine = require("jasmine");
const jasmine = new Jasmine();

// spec files are in this directory

jasmine.loadConfig({
    spec_dir: "",
    spec_files: [
      "tests/**/*.js",
    ],
    helpers: [],
    stopSpecOnExpectationFailure: false,
    random: true,
  });

jasmine.execute();