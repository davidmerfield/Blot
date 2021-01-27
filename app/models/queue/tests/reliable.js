describe("Queue", function () {
	require("./setup")();

	it("lets you reprocess active tasks if needed", function (done) {
		let task = { path: "foo" };

		this.queue.process((blogID, task, callback) => {
			this.queue.inspect((err, res) => {
				expect(res.completed).toEqual([]);
				expect(res.processing).toEqual([blogID + ":" + JSON.stringify(task)]);

				this.queue.reprocess((err) => {
					this.queue.inspect((err, res) => {
						expect(res.completed).toEqual([]);
						expect(res.processing).toEqual([]);
						expect(res.blogs).toContain("blogID");
						expect(res.queues.blogID.length).toEqual(1);
						done();
					});
				});
			});
		});

		this.queue.add("blogID", task, function () {});
	});

	it("calling reprocess multiple times works", function (done) {
		let task = { path: "foo" };

		this.queue.process((blogID, task, callback) => {
			this.queue.reprocess((err) => {
				this.queue.reprocess((err) => {
					this.queue.inspect((err, res) => {
						expect(res.completed).toEqual([]);
						expect(res.processing).toEqual([]);
						expect(res.blogs).toContain("blogID");
						expect(res.queues.blogID.length).toEqual(1);
						done();
					});
				});
			});
		});

		this.queue.add("blogID", task, function () {});
	});

	it("distributes tasks across reliable task runners", function (done) {
		this.createWorkers(3, __dirname + "/workers/reliable.js");

		let tasks = [
			{ path: "foo" },
			{ path: "bar" },
			{ path: "baz" },
			{ path: "bat" },
			{ path: "tat" },
		];

		this.queue.add("blogID", tasks);

		const check = setInterval(() => {
			this.queue.inspect(function (err, res) {
				if (res.completed.length !== tasks.length) return;
				clearInterval(check);
				done();
			});
		}, 15);
	});

	it("distributes tasks across unreliable task runners", function (done) {
		this.createWorkers(3, __dirname + "/workers/unreliable.js");

		let tasks = [{ path: "foo" }, { path: "bar" }, { path: "baz" }];

		this.queue.add("blogID", tasks);

		const check = setInterval(() => {
			this.queue.inspect(function (err, res) {
				if (res.completed.length !== tasks.length) return;
				clearInterval(check);
				done();
			});
		}, 15);
	});
});
