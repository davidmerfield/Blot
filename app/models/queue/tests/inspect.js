describe("Queue.inspect", function () {
	require("./setup")();

	var add = require("../add");
	var inspect = require("../inspect");

	it("inspects the queue", function (done) {
		var test = this;
		var task = { path: "foo" };

		add(test.blog.id, task, function (err) {
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
