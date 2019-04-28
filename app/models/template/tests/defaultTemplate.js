describe("template", function() {
  var defaultTemplate = require("../index").defaultTemplate;

  it("exposes a defaultTemplate property which returns the ID of Blot's default template", function() {
    expect(defaultTemplate).toEqual("SITE:default");
  });
});
