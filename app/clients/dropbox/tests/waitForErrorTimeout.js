describe("dropbox client utility", function() {
  var waitForErrorTimeout = require("../util/waitForErrorTimeout");

  var randomFail = function(input) {
    return new Promise(function(resolve, reject) {
      if (input === "yes") {
        resolve("Yes!");
      } else {
        reject({ error: { error: { retry_after: 1 } } });
      }
    });
  };

  it("waits for error timeouts", function(done) {
    randomFail("yses")
      .then(function(res) {
        console.log(res);
      })
      .catch(waitForErrorTimeout)
      .catch(function(err) {
        console.log(err);
      });
  });
});
