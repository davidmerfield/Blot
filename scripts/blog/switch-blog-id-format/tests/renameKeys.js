xdescribe("switchBlogID script", function() {
  var switchBlogID = require("../index");
  var client = require("client");

  global.test.blog();

  it("renames keys associated with old id", function(done) {
    var test = this;

    client.keys("*", function(err, initialKeys) {
      if (err) return done.fail(err);
      switchBlogID(test.blog.id, function(err, newID) {
        if (err) return done.fail(err);

        // We need to modify this property so the cleanup
        // function can remove the blog safely.
        test.blog.id = newID;

        client.keys("*", function(err, keys) {
          if (err) return done.fail(err);

          // We create one new key to make the script repeatable
          expect(initialKeys.length + 1).toEqual(keys.length);
          done();
        });
      });
    });
  });
});
