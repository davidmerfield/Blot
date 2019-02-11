describe("local client", function() {
  var fs = require("fs-extra");
  var setup = require("../controllers/setup");

  global.test.blog();

  // Sets up a temporary tmp folder and cleans it up after
  global.test.tmp();

  beforeEach(function(done) {
    setup(this.blog.id, this.tmp, done);
  });

  xit("syncs a new file", function(done) {
    fs.outputFileSync(this.tmp + "/hello.txt", "Hello World!");
    setTimeout(function() {
      console.log('CHecking file..');
      expect(fs.existsSync(this.blogDirectory + "/hello.txt")).toEqual(true);

      fs.removeSync(this.tmp + "/hello.txt");

      setTimeout(function() {
  
        console.log('CHecking file..');
        expect(fs.existsSync(this.blogDirectory + "/hello.txt")).toEqual(false);
        done();
      }, 1000);
    }, 2000);
  });

});
