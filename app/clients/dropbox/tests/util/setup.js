module.exports = function setup(options) {
  options = options || {};
  var Dropbox = require("dropbox");
  var fs = require("fs-extra");
  var Express = require("express");
  var database = require("../../database");
  var Blog = require('blog');
  
  var server = {
    start: function attempt(done) {
      var port = 10000 + Math.round(Math.random() * 10000);
      this.server = Express()
        .use("/clients/dropbox", require("../../index").site_routes)
        .listen(port, function(err) {
          if (err && err.code === "EADDRINUSE") return attempt(done);
          if (err && err.code === "EACCESS") return attempt(done);
          if (err) return done(err);
          done();
        });
      this.server.port = port;
    },
    close: function(done) {
      this.server.close(done);
    }
  };

  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  // Set up a clean server for each test
  beforeEach(server.start);
  afterEach(server.close);

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  // Create fake dropbox account
  beforeEach(function(done) {
    var email = this.fake.internet.email();
    var blogID = this.blog.id;

    Blog.set(blogID, { client: "dropbox" }, function(err) {
      database.set(
        blogID,
        {
          account_id: process.env.BLOT_DROPBOX_TEST_ACCOUNT_ID,
          access_token: process.env.BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN,
          email: email,
          error_code: 0,
          last_sync: Date.now(),
          full_access: false,
          folder: "",
          folder_id: "",
          cursor: ""
        },
        done
      );
    });
  });

  // Remove fake account
  afterEach(function(done) {
    database.drop(this.blog.id, done);
  });

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.appFolderClient = new Dropbox({
      accessToken: process.env.BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN
    });
    this.fullFolderClient = new Dropbox({
      accessToken: process.env.BLOT_DROPBOX_TEST_ACCOUNT_FULL_TOKEN
    });
    this.client = this.appFolderClient;
  });

  beforeEach(require("./emptyFolder"));

  beforeEach(function() {
    this.webhook = require("./webhook")(this.server.port);
  });
};
