describe("Queue", function () {
	require("./setup")();
	var colors = require("colors/safe");

	it("lets you hammer the queue with new tasks while reprocessing tasks and nothing gets droppped", function (done) {
		var blogID = "blogID";
		var id = 0;
		var tasks_added = [];
		var tasks_completed = [];
		var hang_task = false;
		var hanged_task_id;
		var done_adding = false;

		this.queue.process(function (blogID, task, callback) {
			if (hang_task) {
				hanged_task_id = task.id;
				hang_task = false;
			} else {
				tasks_completed.push(task.id);

				if (
					done_adding &&
					hanged_task_id &&
					tasks_completed.length == tasks_added.length
				) {
					expect(tasks_completed.sort()).toEqual(tasks_added.sort());
					done();
				}

				callback();
			}
		});

		const addTask = () => {
			let new_task_id = id++;
			tasks_added.push(new_task_id);
			this.queue.add(blogID, { id: new_task_id });
		};

		const hammerAdd = setInterval(addTask, 15);

		// Make one task 'hang' after 1s
		setTimeout(() => {
			hang_task = true;
		}, 1000 * 1);

		// Reprocess all tasks after 2s
		setTimeout(() => {
			this.queue.reprocess();
		}, 1000 * 2);

		// Stop adding tasks after 3s
		setTimeout(() => {
			done_adding = true;
			clearInterval(hammerAdd);
			addTask();
		}, 1000 * 3);
	});

	it("lets you reprocess active tasks if needed", function (done) {
		let task = { path: "foo" };
		let blogID = "blogID";
		let processor_called = 0;

		let processor = () => {
			console.log("processor invoked");
			processor_called++;

			if (processor_called === 1) {
				this.queue.inspect((err, res) => {
					console.log(res);
					expect(res.completed).toEqual([]);
					expect(res.processing).toEqual([blogID + ":" + JSON.stringify(task)]);
					console.log("reprocessing tasks");
					this.queue.reprocess();
				});
			} else if (processor_called === 2) {
				this.queue.inspect((err, res) => {
					console.log(res);
					expect(res.completed).toEqual([]);
					expect(res.processing).toEqual([blogID + ":" + JSON.stringify(task)]);
					done();
				});
			} else {
				done.fail();
			}
		};

		console.log("registering processor");
		this.queue.process(processor);

		console.log("adding task ");
		this.queue.add(blogID, task);
	});

	it("calling reprocess multiple times works", function (done) {
		let task = { path: "foo" };
		let processor = () => {};

		this.queue.process(processor);

		this.queue.add("blogID", task, (err) => {
			this.queue.reprocess((err) => {
				this.queue.reprocess((err) => {
					this.queue.inspect((err, res) => {
						expect(res.completed).toEqual([]);
						done();
					});
				});
			});
		});
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
