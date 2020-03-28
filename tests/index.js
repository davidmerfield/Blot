var Jasmine = require("jasmine");
var jasmine = new Jasmine();
var colors = require("colors");
var seedrandom = require("seedrandom");
var async = require("async");
var Express = require("express");
var seed;
var config = {
  spec_dir: "",
  spec_files: [
    "tests/**/*.js",
    "app/**/tests/*.js",
    "app/**/tests.js",
    "scripts/**/tests.js",
    "scripts/**/tests/*.js",
    "!**/node_modules/**" // excludes tests inside node_modules directories
  ],
  helpers: [],
  stopSpecOnExpectationFailure: false,
  random: true
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
    config.spec_files = ["**/tests/**/*.js", "**/tests.js"];
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
  specStarted: function(result) {
    console.log();
    console.log(colors.dim(".. " + result.fullName));
  },
  specDone: function(result) {
    console.log(colors.dim(". " + result.fullName));
    console.log();
  }
});

global.test = {
  CheckEntry: require("./util/checkEntry"),

  compareDir: require("./util/compareDir"),

  fake: require("./util/fake"),

  user: function() {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));
  },

  server: function(fn) {
    var server;
    var port = 8919;

    // Create a webserver for testing remote files
    beforeAll(function(done) {
      server = Express();

      // Load in routes in suite
      fn(server);

      this.origin = "http://localhost:" + port;
      server = server.listen(port, function() {
        // I was getting unexpected results without
        // this arbritary delay. Basically, the dynamic
        // routes in my server were not working, but the
        // static folder was being served. This was serving
        // raw template files at endpoints, breaking my
        // broken link checking test. We would solve this
        // by only calling back to done once the server is
        // truly responding to requests properly...
        setTimeout(done, 1500);
      });
    });

    afterAll(function(done) {
      server.close(done);
      setTimeout(done, 1500);
    });
  },

  blogs: function(total) {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));

    beforeEach(function(done) {
      var context = this;
      context.blogs = [];
      async.times(
        total,
        function(blog, next) {
          var result = { user: context.user };
          require("./util/createBlog").call(result, function() {
            context.blogs.push(result.blog);
            next();
          });
        },
        done
      );
    });

    afterEach(function(done) {
      var context = this;
      async.each(
        this.blogs,
        function(blog, next) {
          require("./util/removeBlog").call(
            { user: context.user, blog: blog },
            next
          );
        },
        done
      );
    });
  },

  blog: function() {
    beforeEach(require("./util/createUser"));
    afterEach(require("./util/removeUser"));

    beforeEach(require("./util/createBlog"));
    afterEach(require("./util/removeBlog"));
  },

  tmp: function() {
    beforeEach(require("./util/createTmpDir"));
    afterEach(require("./util/removeTmpDir"));
  }
};

jasmine.execute();
