describe("Queue.add", function () {
	require("./setup")();

	it("adds a task", function (done) {
		this.queue.add(this.blog.id, { path: "foo" }, done);
	});

	it("adds multiple tasks", function (done) {
		this.queue.add(this.blog.id, [{ path: "foo" }, { path: "bar" }], done);
	});
});
