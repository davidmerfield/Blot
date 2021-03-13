describe("Queue.destroy", function () {
	require("./setup")();

	it("is exposed as a method", function (done) {
		this.queue.destroy(done);
	});

	it("removes all keys associated with the queue", function (done) {
		this.queue.add(this.blog.id, [1, 2, 3, 4]);
		
		let reset_flag;
		let reprocess_flag;
		
		this.queue.process((blogID, task, done) => {
			if (task === 2 && !reset_flag) {
				reset_flag = true;
				this.queue.reset();
			} else if (task === 3 && !reprocess_flag) {
				reprocess_flag = true;
				this.queue.reprocess(process.pid);
			} else {
				done();
			}
		});

		this.queue.drain(() => {
			this.queue.destroy((err) => {
				if (err) return done.fail(err);
				require("client").keys(`queue:${this.queueID}*`, (err, keys) => {
					if (err) return done.fail(err);
					expect(keys).toEqual([]);
					done();
				});
			});
		});
	});
});
