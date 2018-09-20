describe("authenticate", function() {
  beforeEach(require("./util/createRepo"));

  var Git = require("simple-git")(require("./util/dataDirectory")).silent(true);
  var repoUrl = require("./util/repoUrl");

  it("allows a valid user to clone a valid repo", function(done) {
    var url = repoUrl(global.blog.handle, global.gitToken, global.blog.handle);

    Git.clone(url, function(err) {
      expect(err).toEqual(null);
      done();
    });
  });
  
  it("prevents valid user from accessing other repo", function(done) {
    var badRepo = "other_repo";
    var url = repoUrl(global.blog.handle, global.gitToken, badRepo);

    Git.clone(url, function(err) {
      expect(err).toContain("401 Unauthorized");
      done();
    });
  });

  it("prevents invalid user from accessing valid repo", function(done) {
    var badHandle = "other_repo";
    var url = repoUrl(badHandle, global.gitToken, global.blog.handle);

    Git.clone(url, function(err) {
      expect(err).toContain("401 Unauthorized");
      done();
    });
  });
});
