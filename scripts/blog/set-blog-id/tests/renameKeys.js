describe("switchBlogID script", function() {
  var switchBlogID = require("../index");
  var client = require("client");

  global.test.blog();

  it("renames keys associated with old id", function(done) {
    var test = this;
    var newID = Date.now().toString();

    client.keys('*',function(err, initialKeys) {
      if (err) return done.fail(err);
      switchBlogID(test.blog.id, newID, function(err) {
        if (err) return done.fail(err);

        // We need to modify this property so the cleanup
        // function can remove the blog safely.
        test.blog.id = newID;

        client.keys('*',function(err, keys) {
          if (err) return done.fail(err);

          expect(initialKeys.length).toEqual(keys.length);
          console.log(initialKeys);
          console.log(keys);
          done();
        });
      });
    });
  });
});
