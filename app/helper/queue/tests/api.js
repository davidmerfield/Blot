describe("Queue API", function () {
	require("./setup")();

	it("adds a task", function (done) {
		this.queue.add(this.blog.id, { path: "foo" }, done);
	});

	it("adds multiple tasks", function (done) {
		this.queue.add(this.blog.id, [{ path: "foo" }, { path: "bar" }], done);
	});

	// inspect non existent queue


	// multiple queues at once

	// destory removes all keys
	
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
		this.queue.reset(done);
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

	it("calls drain for multiple blogs", function (done) {
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
