describe("dropbox client", function() {
  var Delta = require("../delta");

  function setupDelta(done) {
    var context = this;
    var account = this.account;
    var delta = new Delta(account.access_token, account.folder_id);

    this.delta = delta;

    delta(account.cursor, function handle(err, res) {
      if (err) return done(err);

      if (res.has_more) return delta(res.cursor, handle);

      context.account.cursor = res.cursor;
      console.log("Set up delta!");
      done();
    });
  }

  describe("in subfolder", function() {
    require("./util/setup")();
    beforeEach(setupDelta);
    specs();
  });

  describe("in root", function() {
    require("./util/setup")({ root: true });
    beforeEach(setupDelta);
    specs();
  });

  function specs() {
    it(
      "retrieves list of changes",
      function(done) {
        this.delta(this.account.cursor, function(err, res) {
          if (err) return done.fail(err);

          expect(res.entries).toEqual([]);
          expect(res.has_more).toEqual(false);
          expect(res.cursor).toEqual(jasmine.any(String));

          done();
        });
      },
      30 * 1000
    );

    it(
      "detects a new file",
      function(done) {
        var delta = this.delta;
        var client = this.client;
        var account = this.account;

        var path = this.fake.path(".txt");
        var contents = this.fake.file();

        client
          .filesUpload({
            path: account.folder + path,
            contents: contents
          })
          .then(function() {
            delta(account.cursor, function(err, res) {
              if (err) return done.fail(err);

              expect(
                res.entries.some(function(entry) {
                  return (
                    entry.relative_path === path.toLowerCase() &&
                    entry[".tag"] === "file"
                  );
                })
              ).toEqual(true);

              done();
            });
          })
          .catch(function(err) {
            done.fail(err);
          });
      },
      30 * 1000
    );
  }
});
