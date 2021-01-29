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

	it("calls drain when the queue for a blog is empty", function (done) {
		this.queue.drain(function (blogID) {
			expect(blogID).toEqual("blogID");
			done();
		});

		this.queue.process(function (blogID, task, done) {
			done();
		});

		this.queue.add("blogID", {});
	});

	it("inspects the queue", function (done) {
		var test = this;
		var task = { path: "foo" };

		test.queue.add(test.blog.id, task, function (err) {
			expect(err).toBe(null);
			test.queue.inspect(function (err, res) {
				expect(err).toEqual(null);
				expect(res[test.blog.id]).toEqual({
					active: [],
					ended: [],
					queued: [task],
				});
				done();
			});
		});
	});
});
