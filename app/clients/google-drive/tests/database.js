describe("google drive client: database", function () {
  const database = require("../database");
  it("can store and retrieve account information", function (done) {
    database.setAccount("123", { foo: "bar" }, function (err) {
      if (err) throw err;
      database.getAccount("123", function (err, account) {
        if (err) throw err;
        console.log("got account", account);
        done();
      });
    });
  });
});
