describe("Queue.inspect", function () {
	require("./setup")();

	it("inspects the queue", function (done) {
		var test = this;
		var task = { path: "foo" };

		test.queue.add(test.blog.id, task, function (err) {
			expect(err).toBe(null);
			test.queue.inspect(function (err, res) {
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
