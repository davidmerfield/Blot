describe("parseTemplate", function () {
  require("./setup")({ createTemplate: true });

  var parseTemplate = require("../parseTemplate");

  it("parses an empty template", function () {
    var template = "";
    var result = parseTemplate(template);
    expect(result).toEqual({ partials: {}, retrieve: {} });
  });

  it("parses partials from a template", function () {
    var template = `{{> foo}}`;
    var result = parseTemplate(template);
    expect(result).toEqual({ partials: { foo: null }, retrieve: {} });
  });

  it("parses locals to retrieve from a template", function () {
    var template = `{{folder}}`; // folder is on the whitelist of variables
    var result = parseTemplate(template);
    expect(result).toEqual({ partials: {}, retrieve: { folder: true } });
  });

  it("ignores locals that cannot be retrieved from a template", function () {
    var template = `{{xyz}}`; // not on the whitelist of variables
    var result = parseTemplate(template);
    expect(result).toEqual({ partials: {}, retrieve: {} });
  });

  it("captures the root local used", function () {
    var template = `{{folder.length}}`; // not on the whitelist of variables
    var result = parseTemplate(template);
    expect(result).toEqual({ partials: {}, retrieve: { folder: true } });
  });
});
