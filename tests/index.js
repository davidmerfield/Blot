var Jasmine = require("jasmine");
var jasmine = new Jasmine();
var colors = require("colors");
var seedrandom = require("seedrandom");
var async = require("async");
var seed;
var config = {
  spec_dir: "",
  spec_files: [
    "tests/**/*.js",
    "app/**/tests/**/*.js",
    "app/**/tests.js",
    "!app/documentation/build/finder", // excludes tests inside node_modules directories
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: true,
};

// Pass in a custom test glob for running only specific tests
if (process.argv[2]) {
  console.log("Running specs in", colors.cyan(process.argv[2]));

  // We have passed specific file to run
  if (process.argv[2].slice(-3) === ".js") {
    config.spec_files = [process.argv[2]];

    // We have passed directory of tests to run
  } else {
    config.spec_dir = process.argv[2];
    config.spec_files = [
      "**/tests/**/*.js",
      "**/tests.js",
      "!**/node_modules/**",
    ];
  }
} else {
  console.log(
    "If you want to run tests from a subdirectory:",
    colors.cyan("npm test {path_to_specs}")
  );
}

if (process.argv[3]) {
  seed = process.argv[3];
} else {
  seed = process.env.BLOT_TESTS_SEED || Math.floor(Math.random() * 100000) + "";
  console.log(
    'If you want your own seed run "npm test {path_to_specs} {seed}"'
  );
}

seedrandom(seed, { global: true });
jasmine.seed(seed);
jasmine.loadConfig(config);

jasmine.addReporter({
  specStarted: function (result) {
    console.time(colors.dim(" " + result.fullName));
  },
  specDone: function (result) {
    console.timeEnd(colors.dim(" " + result.fullName));
  },
});

var startTimes = {};
var durations = {};

jasmine.addReporter({
  specStarted: function (result) {
    startTimes[result.fullName] = Date.now();
  },
  specDone: function (result) {
    durations[result.fullName] = Date.now() - startTimes[result.fullName];
  },
  jasmineDone: function () {
    console.log("Slowest specs:");
    Object.keys(durations)
      .sort(function (a, b) {
        return durations[b] - durations[a];
      })
      .map((fullName) => durations[fullName] + "ms " + colors.dim(fullName))
      .slice(0, 10)
      .forEach((line) => console.log(line));

  },
});

global.test = {
  CheckEntry: require("./util/checkEntry"),
  SyncAndCheck: require("./util/syncAndCheck"),

  compareDir: require("./util/compareDir"),

  fake: require("./util/fake"),

  user: function () {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));
  },

  server: require('./util/server'),

  blogs: function (total) {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));

    beforeEach(function (done) {
      var context = this;
      context.blogs = [];
      async.times(
        total,
        function (blog, next) {
          var result = { user: context.user };
          require("./util/createBlog").call(result, function () {
            context.blogs.push(result.blog);
            next();
          });
        },
        done
      );
    });

    afterEach(function (done) {
      var context = this;
      async.each(
        this.blogs,
        function (blog, next) {
          require("./util/removeBlog").call(
            { user: context.user, blog: blog },
            next
          );
        },
        done
      );
    });
  },

  blog: function () {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));

    beforeEach(require("./util/createBlog"));
    afterEach(require("./util/removeBlog"));
  },

  tmp: function () {
    beforeEach(require("./util/createTmpDir"));
    afterEach(require("./util/removeTmpDir"));
  },
};

jasmine.execute();
