describe("write", function() {
  beforeEach(require("./util/createRepo"));

  var write = require("../write");
  var clone = require("./util/clone");
  var Git = require("simple-git");
  var fs = require("fs-extra");

  it("writes a file", function(done) {
    var git;
    var path = "/How/about That name.txt";
    var content = "Hello, world!";

    clone(function(err, clonedDir) {
      expect(err).toEqual(null);

      write(global.blog.id, path, content, function() {

        expect(err).toEqual(null);

        git = Git(clonedDir).silent(true);

        git.pull(function(err) {
          expect(err).toEqual(null);
          expect(fs.readFileSync(clonedDir + path, "utf-8")).toEqual(content);

          done();
        });
      });
    });
  });
});
