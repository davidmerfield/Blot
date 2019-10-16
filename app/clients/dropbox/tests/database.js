describe("dropbox database", function() {
  var database = require("../database");

  // Create test blog
  global.test.blog();

  describe("sets", function() {
    it("a valid account", function(done) {
      database.set(this.blog.id, fakeAccount(), done);
    });
  });

  describe("gets", function() {
    beforeEach(function(done) {
      database.set(this.blog.id, fakeAccount(), done);
    });

    it("a valid account", function(done) {
      database.get(this.blog.id, function(err, account) {
        if (err) return done.fail(err);
        done();
      });
    });
  });

  describe("drops", function() {
    beforeEach(function(done) {
      database.set(this.blog.id, fakeAccount(), done);
    });

    it("a valid account", function(done) {
      database.drop(this.blog.id, done);
    });
  });

  function fakeAccount() {
    return {
      account_id: "XXXXX",
      access_token: "YYYYY",
      email: "",
      error_code: 0,
      last_sync: Date.now(),
      full_access: false,
      folder: "",
      folder_id: "",
      cursor: ""
    };
  }
});
