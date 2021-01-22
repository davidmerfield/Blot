describe("Queue.addTask", function () {
	global.test.blog();

	afterEach(function (done) {
		require("../reset")(done);
	});

	var addTask = require("../addTask");

	it("adds a task", function (done) {
		addTask(this.blog.id, "foo", done);
	});

	it("adds multiple tasks", function (done) {
		addTask(this.blog.id, ["foo", "bar"], done);
	});
});
