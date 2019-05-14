describe("switchBlogID script", function() {
  var switchBlogID = require("../index");
  var search = require("./search");

  global.test.blog();

  // We need to modify this property so the cleanup
  // function can remove the blog safely.
  beforeEach(function() {
    this.oldID = this.blog.id;
    this.newID = Date.now().toString();
    this.blog.id = this.newID;
  });

  afterEach(function(done) {
    search(this.oldID, function(err, results) {
      if (err) return done.fail(err);
      expect(results).toEqual([]);
      done();
    });
  });

  it("switches the id of a blog", function(done) {
    switchBlogID(this.oldID, this.newID, function(err) {
      if (err) return done.fail(err);

      done();
    });
  });

  it("handles blogs who've changed their handle", function(done) {
    var oldID = this.oldID;
    var newID = this.newID;

    require("blog").set(oldID, { handle: "example" }, function(err) {
      if (err) return done.fail(err);
      switchBlogID(oldID, newID, done);
    });
  });

  it("handles blogs who've change their domain", function(done) {
    var oldID = this.oldID;
    var newID = this.newID;

    require("blog").set(oldID, { domain: "example.com" }, function(err) {
      if (err) return done.fail(err);

      require("blog").set(oldID, { domain: "newexample.com" }, function(err) {
        if (err) return done.fail(err);
        switchBlogID(oldID, newID, done);
      });
    });
  });
});
