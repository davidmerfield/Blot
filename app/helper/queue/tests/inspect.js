describe("Queue.inspect", function () {
  require("./setup")();

  it("inspects an empty queue", function (done) {
    this.queue.inspect((err, res) => {
      if (err) return done.fail(err);
      expect(res).toEqual({ sources: [], processors: [] });
      done();
    });
  });

  it("inspects the queue", function (done) {
    var task = { path: "foo" };

    this.queue.add(this.blog.id, task, (err) => {
      expect(err).toBe(null);
      this.queue.inspect((err, res) => {
        expect(err).toEqual(null);
        expect(res[this.blog.id]).toEqual({
          active: [],
          ended: [],
          queued: [task],
        });
        done();
      });
    });
  });
});
