describe("local client", function () {
  var fs = require("fs-extra");
  var setup = require("../controllers/setup");

  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  // This causes an error sometimes
  xit("handles new file when setting up", function (done) {
    fs.outputFileSync(this.tmp + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function (err) {
      done();
    });
  });

  // This causes an error sometimes
  xit("handles existing file when setting up", function (done) {
    fs.outputFileSync(this.blogDirectory + "/" + "hello.txt", "Hello World!");
    fs.outputFileSync(this.tmp + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function (err) {
      done();
    });
  });

  // This causes an error sometimes
  xit("handles removed file when setting up", function (done) {
    fs.outputFileSync(this.blogDirectory + "/" + "hello.txt", "Hello World!");

    setup(this.blog.id, this.tmp, function (err) {
      done();
    });
  });
});
