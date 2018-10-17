describe("template", function() {
  require("./setup")();
  
  var set = require("../set");

  it("sets a view", function(done) {
    set(this.template.id, {name: this.fake.random.word()}, done);
  });
});
