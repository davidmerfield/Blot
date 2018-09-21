describe("authenticate", function() {
  var Git = require("simple-git")(require("./util/dataDirectory")).silent(true);
  var repoUrl = require("./util/repoUrl");
  var database = require("../database");
  var setupUser = require("./util/setupUser");

  it("prevents a previously valid user if they refresh their tokens", function(done) {
    setupUser(function(err) {
      expect(err).toEqual(null);

      database.refreshToken(global.blog.id, function(err) {
        expect(err).toEqual(null);

        global.usersGitClient.commit("initial", function(err) {
          expect(err).toEqual(null);

          global.usersGitClient.push(function(err) {
            expect(err).not.toEqual(null);
            expect(err).toContain("401 Unauthorized");

            done();
          });
        });
      });
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
