module.exports = function setup(options) {
  options = options || {};
  var database = require("../../database");
  var Blog = require("blog");
  var server = require("./server");
  var createClient = require("../../util/createClient");

  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  // Set up a clean server for each test
  beforeEach(server.start);
  afterEach(server.close);

  // Allows us to check if a blog has finished syncing...
  beforeEach(function() {
    var port = this.server.port;
    var blogID = this.blog.id;

    this.afterSync = function(callback) {
      var http = require("http");
      var url = require("url").format({
        protocol: "http",
        hostname: "localhost",
        port: port,
        pathname: "/clients/dropbox/syncs-finished/" + blogID
      });

      http.get(url, function check(res) {
        var response = "";
        res.setEncoding("utf8");
        res.on("data", function(chunk) {
          response += chunk;
        });
        res.on("end", function() {
          if (response === "true") {
            callback(null);
          } else {
            http.get(url, check);
          }
        });
      });
    };
  });

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.fake = global.test.fake;
  });

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function() {
    this.client = createClient(process.env.BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN);
  });

  // Create a 'blog folder' for the tests to run against. Why
  // not just use entire Dropbox folder? We hit 429 too many
  // write operation errors for some dumb reason...
  beforeEach(function(done) {
    var client = this.client;
    var context = this;
    var folder = "/" + this.fake.random.word();

    client
      .filesCreateFolder({ path: folder })
      .then(function(res) {
        context.folder = res.path_lower;
        context.folderID = res.id;
        done();
      })
      .catch(function(err) {
        return done(new Error(err));
      });
  });

  // Create fake dropbox account
  beforeEach(function(done) {

    var email = this.fake.internet.email();
    var blogID = this.blog.id;
    var folder = this.folder;
    var folderID = this.folderID;

    Blog.set(blogID, { client: "dropbox" }, function(err) {
      if (err) return done(err);

      database.set(
        blogID,
        {
          account_id: process.env.BLOT_DROPBOX_TEST_ACCOUNT_ID,
          access_token: process.env.BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN,
          email: email,
          error_code: 0,
          last_sync: Date.now(),
          full_access: false,
          folder: folder,
          folder_id: folderID,
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

  beforeEach(function() {
    var Webhook = require("./webhook");
    var accountID = process.env.BLOT_DROPBOX_TEST_ACCOUNT_ID;
    var webhook = new Webhook(
      process.env.BLOT_DROPBOX_APP_SECRET,
      this.server.baseUrl + "/webhook"
    );

    this.webhook = function(callback) {
      webhook.notify(accountID, callback);
    };
  });

  // beforeEach(require("./emptyFolder"));

  // afterAll(require("./emptyFolder"));
};
