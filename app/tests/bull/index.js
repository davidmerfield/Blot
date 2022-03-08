describe("bull", function () {
  var build = require("./build");

  global.test.blog();

  it("recovers from an exception in processor", async function (done) {
    build(
      {
        throw: true,
      },
      function (err) {
        expect(err.message).toEqual("Simulated uncaught exception");
        build({}, function (err, result) {
          expect(result).toEqual("Success");
          done();
        });
      }
    );
  });

it("recovers from unexpected exit of worker", async function (done) {
    build(
      {
        exitWithError: true,
      },
      function (err) {
        expect(err.message).toEqual("Unexpected exit code: 1 signal: null");
        build({}, function (err, result) {
          expect(result).toEqual("Success");
          done();
        });
      }
    );
  });

  it("recovers from an exception in dependency of processor", async function (done) {
    build(
      {
        throwInDependency: true,
      },
      function (err) {
        expect(err.message).toEqual("Simulated exception in dependency");
        build({}, function (err, result) {
          expect(result).toEqual("Success");
          done();
        });
      }
    );
  });
});
