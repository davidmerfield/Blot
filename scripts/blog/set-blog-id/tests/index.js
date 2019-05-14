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
    var test = this;
    switchBlogID(test.oldID, test.newID, function(err) {
      if (err) return done.fail(err);

      search(test.oldID, function(err, results) {
        if (err) return done.fail(err);
        expect(results).toEqual([]);
        done();
      });
    });
  });

  it("can be run multiple times without breaking anything", function(done) {
    var oldID = this.oldID;
    var newID = this.newID;

    switchBlogID(oldID, newID, function(err) {
      if (err) return done.fail(err);

      switchBlogID(oldID, newID, done);
    });
  });

  it("handles blogs who change their handle", function(done) {
    require("blog").set(this.oldID, { handle: "example" }, done);
  });

  it("handles blogs who change their domain", function(done) {
    var test = this;
    require("blog").set(test.oldID, { domain: "example.com" }, function(err) {
      if (err) return done.fail(err);

      require("blog").set(test.oldID, { domain: "newexample.com" }, done);
    });
  });

  xit("handles Templates", function(done) {
    require("template").create(
      this.oldID,
      "example",
      { cloneFrom: "SITE:default" },
      done
    );
  });
});
