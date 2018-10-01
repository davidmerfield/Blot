describe("dropbox client", function() {
  // Create test user and tmp directory
  require("./util/setup")();

  it("syncs a file", function(done) {
    var client = this.client;
    var webhook = this.webhook;
    var path = this.fake.path('.txt');
    var contents = this.fake.file();
    var blogDirectory = this.blogDirectory;
    var fs = require('fs-extra');

    client
      .filesUpload({ path: path, contents: contents })
      .then(function(res) {
  
        webhook(function(err){

          if (err) return done.fail(err);

          setTimeout(function(){

            expect(fs.readFileSync(blogDirectory + path, 'utf-8')).toEqual(contents);
            done();

          }, 5 * 1000);
        });
      })
      .catch(function(err) {
        console.log('Error uploading...');
        return done.fail(new Error(err.message));
      });
  }, 10*1000);
});
