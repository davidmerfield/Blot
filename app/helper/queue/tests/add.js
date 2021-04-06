describe("Queue.add", function () {
  const async = require("async");
  require("./setup")();

  it("is exposed as a method", function (done) {
    this.queue.add("source", "task", done);
  });

  it("adds a task", function (done) {
    let task = { path: "foo" };

    this.queue.add(this.blog.id, task, (err) => {
      if (err) return done.fail(err);
      this.queue.inspect((err, res) => {
        expect(res[this.blog.id].queued).toEqual([task]);
        done();
      });
    });
  });

  it("returns an error when you add an unstringifiable task", function (done) {
    this.queue.add(this.blog.id, { x: 2n }, (err) => {
      expect(err instanceof TypeError);
      done();
    });
  });

  it("adds multiple tasks", function (done) {
    this.queue.add(this.blog.id, [{ path: "foo" }, { path: "bar" }], done);
  });

  it("supports tasks of various types", function (done) {
    let tasks = ["first", ["second"], { name: "third" }, 4];
    this.queue.add(this.blog.id, tasks, (err) => {
      if (err) return done.fail(err);
      this.queue.inspect((err, res) => {
        expect(res[this.blog.id].queued.reverse()).toEqual(tasks);
        done();
      });
    });
  });

  it("handles multiple tasks to multiple blogs concurrently", function (done) {
    let blogs = Array.from({ length: 100 }, (x, i) => i);
    let tasks = Array.from({ length: 10 }, (x, i) => i);

    const addTasks = (blogID, next) => {
      async.each(tasks, this.queue.add.bind(null, blogID), next);
    };

    async.each(blogs, addTasks, (err) => {
      if (err) return done.fail(err);
      this.queue.inspect((err, res) => {
        blogs.forEach((blogID) => {
          expect(res[blogID].queued.reverse()).toEqual(tasks);
        });
        done();
      });
    });
  });
});
