describe("render", function() {
  require("./setup")();

  it("renders a view", function(done) {
    var ctx = this;

    ctx.setView({ name: "index", content: "{{blog.title}}" }, function(err) {
      if (err) return done.fail(err);
      ctx.server.get("/", function(req, res) {
        res.renderView("index");
      });

      ctx.listen(function(err) {
        if (err) return done.fail(err);

        ctx.get("/", function(err, res) {
          if (err) return done.fail(err);
          expect(res).toEqual(ctx.blog.title);
          done();
        });
      });
    });
  });
});
