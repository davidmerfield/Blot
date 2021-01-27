describe("Queue", function () {
	require("./setup")();

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
