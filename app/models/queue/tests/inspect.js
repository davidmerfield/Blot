describe("Queue.inspect", function () {
	global.test.blog();

	afterEach(function (done) {
		require("../reset")(done);
	});

	var addTask = require("../addTask");
	var inspect = require("../inspect");

	it("inspects the queue", function (done) {
		var test = this;
		var task = { path: "foo" };

		addTask(test.blog.id, task, function (err) {
			expect(err).toBe(null);
			inspect(function (err, res) {
				expect(err).toBe(null);
				expect(res.completed).toEqual([]);
				expect(res.processing).toEqual([]);
				expect(res.blogs).toEqual([test.blog.id]);
				expect(res.queues[test.blog.id]).toEqual([task]);
				done();
			});
		});
	});
});
