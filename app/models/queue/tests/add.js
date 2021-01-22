describe("Queue.add", function () {
	require("./setup")();

	var add = require("../add");

	it("adds a task", function (done) {
		add(this.blog.id, { path: "foo" }, done);
	});

	it("adds multiple tasks", function (done) {
		add(this.blog.id, [{ path: "foo" }, { path: "bar" }], done);
	});
});
