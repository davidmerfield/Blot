describe("Blog.set", function() {
  var set = require("../set");
  var config = require("config");
  var fs = require("fs-extra");
  var HOSTS = config.cache_directory;

  // Create a test blog before each spec
  global.test.blog();

  it("will set up a symlink from the cache folder to the blog folder", function(done) {
    var test = this;
    var domain = "example.com";

    set(test.blog.id, { domain: domain }, function(err) {
      if (err) return done.fail(err);

      var domainFolder = HOSTS + "/" + domain + "/folder";
      var backupDomainFolder = HOSTS + "/www." + domain + "/folder";

      expect(fs.realpathSync(domainFolder)).toEqual(test.blogDirectory);
      expect(fs.realpathSync(backupDomainFolder)).toEqual(test.blogDirectory);

      done();
    });
  });

  it("will clean up old symlink when you change handle", function(done) {
    var test = this;
    var handle = "exampleabc";
    var newHandleFolder = HOSTS + "/" + handle + "." + config.host + "/folder";
    var handleFolder =
      HOSTS + "/" + test.blog.handle + "." + config.host + "/folder";

    expect(fs.existsSync(newHandleFolder)).toEqual(false);
    expect(fs.realpathSync(handleFolder)).toEqual(test.blogDirectory);

    set(test.blog.id, { handle: handle }, function(err) {
      if (err) return done.fail(err);

      expect(fs.existsSync(handleFolder)).toEqual(false);
      expect(fs.realpathSync(newHandleFolder)).toEqual(test.blogDirectory);

      done();
    });
  });
});
