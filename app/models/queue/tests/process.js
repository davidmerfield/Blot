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

	xit("processes thousands of tasks for thousands of blogs in correct order", function (done) {
		var blogs = [];
		var result = {};
		for (var i = 0; i < 2000; i++) {
			let tasks = [];
			for (var i = 0; i < 2000; i++) {
				tasks.push({
					path: global.test.fake.path(),
				});
			}
			blogs.push(tasks);
		}

		process(function (blogID, task, callback) {
			result[blogID] = result[blogID] || 0;
			result[blogID]++;
			callback();
		});

		async.eachSeries(
			blogs,
			function (tasks, next) {
				add(i, tasks, next);
			},
			function () {
				done();
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
