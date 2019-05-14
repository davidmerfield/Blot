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
});
