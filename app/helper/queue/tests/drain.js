describe("Queue.drain", function () {
  require("./setup")();

  it("is exposed as a method", function (done) {
    this.queue.drain(() => {});
    done();
  });

  it("is invoked when the queue for a blog is empty", function (done) {
    this.queue.drain((blogID) => {
      expect(blogID).toEqual("blogID");
      done();
    });

    this.queue.process((blogID, task, done) => {
      done();
    });

    this.queue.add("blogID", "task");
  });

  it("is invoked for multiple blogs", function (done) {
    let blogIDs = ["a", "b", "c"];
    let task = { path: "/Hello.txt" };

    this.queue.drain(function (blogID) {
      expect(blogIDs.indexOf(blogID) > -1);
      blogIDs = blogIDs.filter((_blogID) => blogID !== _blogID);
      // Fail the test if we get any more calls
      // to drain in the next 500 milliseconds
      if (!blogIDs.length) setTimeout(done, 500);
    });

    this.queue.process(function (blogID, task, done) {
      done();
    });

    blogIDs.forEach((blogID) => this.queue.add(blogID, task));
  });
});
