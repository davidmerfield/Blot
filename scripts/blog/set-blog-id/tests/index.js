describe("switchBlogID script", function() {
  var switchBlogID = require("../index");
  var search = require("./search");

  global.test.blog();

  it("switches the id of a blog", function(done) {
    var test = this;
    var newID = Date.now().toString();

    switchBlogID(test.blog.id, newID, function(err) {
      if (err) return done.fail(err);

      search(test.blog.id, function(err, results) {
        if (err) return done.fail(err);

        expect(results).toEqual([]);

        // We need to modify this property so the cleanup
        // function can remove the blog safely.
        test.blog.id = newID;
        done();
      });
    });
  });
});
