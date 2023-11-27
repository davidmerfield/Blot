describe("dropbox client utility", function () {
  var waitForErrorTimeout = require("../util/waitForErrorTimeout");

  var randomFail = function (input) {
    return new Promise(function (resolve, reject) {
      if (input === "yes") {
        resolve("Yes!");
      } else if (input === "wait") {
        reject({ error: { error: { retry_after: 1 } } });
      } else {
        reject(new Error("Fail"));
      }
    });
  };

  it("does not interfere when there is no timeout", function (done) {
    randomFail("yes")
      .catch(waitForErrorTimeout)
      .catch(function () {
        done.fail(new Error("Should not have errored"));
      })
      .then(function (res) {
        expect(res).toEqual("Yes!");
        done();
      });
  });

  it("resolves immediately for errors without timeouts", function (done) {
    randomFail()
      .catch(waitForErrorTimeout)
      .catch(function (err) {
        expect(err instanceof Error).toEqual(true);
        done();
      });
  });

  it("waits for errors without timeouts", function (done) {
    randomFail("wait")
      .catch(waitForErrorTimeout)
      .catch(function (err) {
        expect(err instanceof Error).toEqual(false);
        done();
      });
  });
});
