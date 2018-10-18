describe("template", function() {
  require("./setup")();

  var parse = require("../parse");
  var fs = require("fs-extra");

  it("parses a view", function(done) {
    var view = "{{> header}}{{#all_entries}}{{appCSS}}{{/all_entries}}";
    expect(parse(view)).toEqual({
      partials: { header: null },
      retrieve: { all_entries: true, appCSS: true }
    });
    done();
  });
});
