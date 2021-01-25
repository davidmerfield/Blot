describe("Queue.add", function () {
	require("./setup")();

	it("adds a task", function (done) {
		this.queue.add("blogID", { path: "foo" }, done);
	});

	it("adds multiple tasks", function (done) {
		this.queue.add("blogID", [{ path: "foo" }, { path: "bar" }], done);
	});
});
