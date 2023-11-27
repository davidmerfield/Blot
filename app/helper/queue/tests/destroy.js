describe("Queue.destroy", function () {
  require("./setup")();

  it("is exposed as a method", function (done) {
    this.queue.destroy(done);
  });

  it("removes all keys associated with the queue", function (done) {
    this.queue.add(this.blog.id, [1, 2, 3, 4]);

    this.queue.process((blogID, task, done) => {
      setTimeout(() => {
        done();
      }, 100);
    });

    this.queue.drain(() => {
      this.queue.destroy((err) => {
        if (err) return done.fail(err);
        require("models/client").keys(`queue:${this.queueID}*`, (err, keys) => {
          if (err) return done.fail(err);
          expect(keys).toEqual([]);
          done();
        });
      });
    });
  });
});
