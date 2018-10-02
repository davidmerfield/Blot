describe("dropbox client", function() {
  // Create test user and tmp directory
  require("./util/setup")();

  it(
    "syncs a file",
    function(done) {
      var client = this.client;
      var webhook = this.webhook;
      var path = this.fake.path(".txt");
      var contents = this.fake.file();
      var blogDirectory = this.blogDirectory;
      var fs = require("fs-extra");
      var afterSync = this.afterSync;
      var otherContents;

      console.log('Starting test...');

      client
        .filesUpload({ path: this.folder + path, contents: contents })
        .then(function() {
            console.log('firing webhook...');
          webhook(function(err) {
            if (err) return done.fail(err);

            console.log('Checking sync...');
            afterSync(function(err) {
              if (err) return done.fail(err);

              try {
                otherContents = fs.readFileSync(blogDirectory + path.toLowerCase(), "utf-8");
              } catch (e) {
                return done.fail(e);
              }

              expect(otherContents).toEqual(contents);

              done();
            });
          });
        })
        .catch(function(err) {
          console.log("Error uploading...");
          return done.fail(new Error(err.message));
        });
    },
    10 * 1000
  );
});
