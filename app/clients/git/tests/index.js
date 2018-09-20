describe("git", function() {
  // Set up tests
  beforeEach(global.createUser);
  beforeEach(global.createBlog);
  beforeEach(require("./util/startServer"));
  beforeEach(require("./util/cleanDataDirectory"));

  // Tear down
  afterEach(require("./util/cleanDataDirectory"));
  afterEach(require("./util/stopServer"));
  afterEach(global.removeBlog);
  afterEach(global.removeUser);

  it("checks user has permission for a repo", function(done) {
    var create = require("../create");
    var database = require("../database");
    var badHandle = 'abc';

    create(global.blog, function(err) {
      if (err) return done(err);

      database.get_token(global.blog.id, function(err, token) {
        if (err) return done(err);

        require("child_process").exec(
          "git clone http://" +
            global.blog.handle +
            ":" +
            token +
            "@localhost:8284/clients/git/end/" +
            badHandle + ".git",
          {
            cwd: require("./util/dataDirectory")
          },
          function(err, stdout, stderr) {
            expect(err).not.toEqual(null);
            expect(err.code).toEqual(128);
            expect(stderr).toContain("401 Unauthorized");
            done();
          }
        );
      });
    });
  });

  it("handles a missing repo", function(done) {
    require("child_process").exec(
      "git clone http://badusername:badtoken@localhost:8284/clients/git/end/foo.git",
      {
        cwd: require("./util/dataDirectory")
      },
      function(err, stdout, stderr) {
        expect(err).not.toEqual(null);
        expect(err.code).toEqual(128);
        expect(stderr).toContain("401 Unauthorized");

        done();
      }
    );
  });

  it("clones a repo", function(done) {
    var create = require("../create");
    var database = require("../database");

    create(global.blog, function(err) {
      if (err) return done(err);

      database.get_token(global.blog.id, function(err, token) {
        if (err) return done(err);

        require("child_process").exec(
          "git clone http://" +
            global.blog.handle +
            ":" +
            token +
            "@localhost:8284/clients/git/end/" +
            global.blog.handle + ".git",
          {
            cwd: require("./util/dataDirectory")
          },
          function(err, stdout, stderr) {
            expect(err).toEqual(null);
            // expect(stderr).toContain("401 Unauthorized");

            done();
          }
        );
      });
    });
  });
});
