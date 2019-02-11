describe("local client", function() {
  var fs = require("fs-extra");
  var setup = require("../controllers/setup");

  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  it("handles new file when setting up", function(done) {
    fs.outputFileSync(this.tmp + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function(err) {
      done();
    });
  });

  it("handles existing file when setting up", function(done) {
    fs.outputFileSync(this.blogDirectory + "/" + "hello.txt", "Hello World!");
    fs.outputFileSync(this.tmp + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function(err) {
      done();
    });
  });

  it("handles removed file when setting up", function(done) {
    fs.outputFileSync(this.blogDirectory + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function(err) {
      done();
    });
  });
});
