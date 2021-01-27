describe("Queue API", function () {
	require("./setup")();

	it("adds a task", function (done) {
		this.queue.add(this.blog.id, { path: "foo" }, done);
	});

	it("adds multiple tasks", function (done) {
		this.queue.add(this.blog.id, [{ path: "foo" }, { path: "bar" }], done);
	});

	it("processes a task", function (done) {
		var task = { path: "foo" };

		this.queue.process(function (blogID, savedTask, callback) {
			expect(blogID).toBe("blogID");
			expect(savedTask).toEqual(task);
			callback();
			done();
		});

		this.queue.add("blogID", task);
	});


	it("reprocesses currently processing tasks on queue", function (done) {
		this.queue.reprocess(done);
	});

	it("destroys the queue", function (done) {
		this.queue.destroy(done);
	});

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
