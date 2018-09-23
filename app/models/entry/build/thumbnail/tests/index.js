describe("thumbnail", function() {
  // Set up tests
  beforeEach(global.createUser);
  beforeEach(global.createBlog);
  beforeEach(require('./util/emptyTestDataDir'));

  // Tear down
  afterEach(global.removeUser);
  afterEach(global.removeBlog);
  afterEach(require('./util/emptyTestDataDir'));
  
  it("creates thumbnails", function(done) {
    require('fs-extra').ensureDirSync(__dirname + "/data");
    require("../transform")(
      __dirname + "/images/portrait.jpg",
      __dirname + "/data",
      function(err, result) {
        expect(err).toBe(null);
        expect(result).toEqual(jasmine.any(Object));

        done();
      }
    );
  });
});
