describe("blog creates", function() {
  // Create a test user before each spec
  global.test.user();

  var create = require("../create");

  it("creates a blog", function(done) {
    create(this.user.uid, { handle: "example" }, function(err, user) {
      expect(err).toEqual(null);
      expect(user).toEqual(jasmine.any(Object));
      done();
    });
  });
});
