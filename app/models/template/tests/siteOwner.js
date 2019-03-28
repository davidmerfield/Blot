describe("template", function() {
  var siteOwner = require("../index").siteOwner;

  it("exposes a siteOwner property which returns the owner ID of Blot", function() {
    expect(siteOwner).toEqual("SITE");
  });
});
