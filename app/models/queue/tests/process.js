describe("Queue.process", function () {
	require("./setup")();

	var async = require("async");

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

	it("gets multiple tasks in order", function (done) {
		var tasks = [{ path: "foo" }, { path: "bar" }];
		var isFirstRun = true;

		this.queue.process(function (blogID, savedTask, callback) {
			expect(blogID).toBe("blogID");

			if (isFirstRun) {
				expect(savedTask).toEqual(tasks[0]);
				isFirstRun = false;
				callback();
			} else {
				expect(savedTask).toEqual(tasks[1]);
				callback();
				done();
			}
		});

		this.queue.add("blogID", tasks);
	});

	it("gets multiple tasks in fair order", function (done) {
		var firstTasks = [{ path: "foo" }, { path: "bar" }];
		var secondTasks = [{ path: "baz" }];
		var completed = [];

		this.queue.add("first_blogID", firstTasks);
		this.queue.add("second_blogID", secondTasks);

		this.queue.process(function (blogID, task, callback) {
			setTimeout(function () {
				completed.push(task);
				callback();

				if (completed.length === 3) {
					expect(completed).toEqual([
						firstTasks[0],
						secondTasks[0],
						firstTasks[1],
					]);
					done();
				}
			}, 100);
		});
	});

	it("processes tasks for many blogs in fair order", function (done) {
		var test = this;
		var blogs = [];
		var totalBlogs = 25;
		var totalTasks = 5;
		var expectedOrder = [];
		var checked = 0;
		var order = [];

		for (let i = 0; i < totalBlogs; i++) {
			let tasks = [];
			for (let x = 0; x < totalTasks; x++) {
				tasks.push({
					path: global.test.fake.path(),
				});
			}
			blogs.push(tasks);
		}

		for (let y = 0; y < totalTasks; y++)
			for (let z = 0; z < totalBlogs; z++)
				expectedOrder.push(z + ":" + blogs[z][y].path);

		async.eachOfSeries(
			blogs,
			function (tasks, index, next) {
				test.queue.add(index, tasks, next);
			},
			function () {
				test.queue.process(function (blogID, task, callback) {
					order.push(blogID + ":" + task.path);
					checked++;
					callback();

					if (checked === blogs.length * blogs[0].length) {
						expect(order).toEqual(expectedOrder);
						return done();
					}
				});
			}
		);
	});

	it("does not error if no task exists", function (done) {
		this.queue.process(function (blogID, task, callback) {
			callback();
		});
		done();
	});
});
