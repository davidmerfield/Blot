describe("template", function() {
  var makeID = require("../index").makeID;

  it("exposes a makeID method which generates a template ID", function() {
    var test = this;
    expect(makeID(test.blog.id, "example")).toEqual(test.blog.id + ":example");
  });
});
