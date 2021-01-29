describe("Queue", function () {
	require("./setup")();
	var colors = require("colors/safe");

	it("lets you hammer the queue with new tasks while reprocessing tasks and nothing gets droppped", function (done) {
		var blogID = this.blog.id;
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
		let processor_called = 0;

		this.queue.add(this.blog.id, task);

		this.queue.process(() => {
			processor_called++;

			if (processor_called === 1) {
				this.queue.inspect((err, res) => {
					expect(res[this.blog.id]).toEqual({
						active: [task],
						ended: [],
						queued: [],
					});
					this.queue.reprocess();
				});
			} else if (processor_called === 2) {
				this.queue.inspect((err, res) => {
					expect(res[this.blog.id]).toEqual({
						active: [task],
						ended: [],
						queued: [],
					});
					done();
				});
			} else {
				done.fail();
			}
		});
	});

	it("calling reprocess multiple times works", function (done) {
		let task = { path: "foo" };
		let processor = () => {};

		this.queue.process(processor);

		this.queue.add(this.blog.id, task, (err) => {
			this.queue.reprocess((err) => {
				this.queue.reprocess((err) => {
					this.queue.inspect((err, res) => {
						expect(res[this.blog.id]).toEqual({
							active: [task],
							ended: [],
							queued: [],
						});
						done();
					});
				});
			});
		});
	});

	it("distributes tasks across reliable task runners", function (done) {
		let tasks = [
			{ path: "foo" },
			{ path: "bar" },
			{ path: "baz" },
			{ path: "bat" },
			{ path: "tat" },
		];

		this.createWorkers({
			count: 3,
			module: "./workers/reliable.js",
			onRestart: () => {
				done.fail();
			},
		});

		this.queue.add(this.blog.id, tasks);

		this.queue.drain((blogID) => {
			expect(blogID).toEqual(this.blog.id);
			this.queue.inspect((err, res) => {
				expect(res[this.blog.id].ended.sort(this.sortTasks)).toEqual(
					tasks.sort(this.sortTasks)
				);
				expect(res[this.blog.id].active).toEqual([]);
				expect(res[this.blog.id].queued).toEqual([]);
				expect(res.blogs).toEqual([]);
				done();
			});
		});
	});

	it("distributes tasks across unreliable workers", function (done) {
		let tasks = [{ path: "foo" }, { path: "bar" }, { path: "baz" }];

		this.createWorkers({
			count: 3,
			module: "./workers/unreliable.js",
			onRestart: () => {
				this.queue.reprocess();
			},
		});

		this.queue.add(this.blog.id, tasks);

		this.queue.drain((blogID) => {
			expect(blogID).toEqual(this.blog.id);
			this.queue.inspect((err, res) => {
				expect(res[this.blog.id].ended.sort(this.sortTasks)).toEqual(
					tasks.sort(this.sortTasks)
				);
				expect(res[this.blog.id].active).toEqual([]);
				expect(res[this.blog.id].queued).toEqual([]);
				expect(res.blogs).toEqual([]);
				done();
			});
		});
	});
});
