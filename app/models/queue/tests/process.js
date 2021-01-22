describe("Queue.process", function () {
	require("./setup")();

	var add = require("../add");
	var process = require("../process");

	it("processes a task", function (done) {
		var test = this;
		var task = { path: "foo" };

		process(function (blogID, savedTask) {
			expect(blogID).toBe(test.blog.id);
			expect(savedTask).toEqual(task);
			done();
		});

		add(test.blog.id, task);
	});

	it("gets multiple tasks in order", function (done) {
		var test = this;
		var tasks = [{ path: "foo" }, { path: "bar" }];
		var isFirstRun = true;

		process(function (blogID, savedTask, callback) {
			expect(blogID).toBe(test.blog.id);

			if (isFirstRun) {
				expect(savedTask).toEqual(tasks[0]);
				isFirstRun = false;
				callback();
			} else {
				expect(savedTask).toEqual(tasks[1]);
				done();
			}
		});

		add(test.blog.id, tasks);
	});

	it("gets multiple tasks in fair order", function (done) {
		var test = this;
		var firstTasks = [{ path: "foo" }, { path: "bar" }];
		var secondTasks = [{ path: "baz" }];
		var completed = [];

		add(test.blog.id, firstTasks);
		add("secondblogID", secondTasks);

		process(function (blogID, task, callback) {
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

	it("does not error if no task exists", function (done) {
		var test = this;

		process(function (blogID, task, callback) {});
		done();
	});
});
