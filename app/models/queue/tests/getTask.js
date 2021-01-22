describe("Queue.getTask", function () {
	global.test.blog();

	afterEach(function (done) {
		require("../reset")(done);
	});

	var addTask = require("../addTask");
	var getTask = require("../getTask");

	it("gets a task", function (done) {
		var test = this;
		var task = { path: "foo" };
		addTask(test.blog.id, task, function (err) {
			expect(err).toBe(null);
			getTask(function (err, blogID, savedTask, callback) {
				expect(err).toBe(null);
				expect(blogID).toBe(test.blog.id);
				expect(savedTask).toEqual(task);
				callback(null, done);
			});
		});
	});

	it("gets multiple tasks in order", function (done) {
		var test = this;
		var tasks = [{ path: "foo" }, { path: "bar" }];

		addTask(test.blog.id, tasks, function (err) {
			getTask(function (err, blogID, task, callback) {
				expect(task).toEqual(tasks[0]);
				getTask(function (err, blogID, task, callback) {
					expect(task).toEqual(tasks[1]);
					callback(null, done);
				});
			});
		});
	});

	it("gets multiple tasks in fair order", function (done) {
		var test = this;
		var firstTasks = [{ path: "foo" }, { path: "bar" }];
		var secondTasks = [{ path: "baz" }];

		addTask(test.blog.id, firstTasks, function (err) {
			addTask("secondblogID", secondTasks, function (err) {
				getTask(function (err, blogID, task, callback) {
					expect(task).toEqual(firstTasks[0]);
					getTask(function (err, blogID, task, callback) {
						expect(task).toEqual(secondTasks[0]);
						getTask(function (err, blogID, task, callback) {
							expect(task).toEqual(firstTasks[1]);
							callback(null, done);
						});
					});
				});
			});
		});
	});

	it("does not error if no task exists", function (done) {
		var test = this;

		getTask(function (err, blogID, task, callback) {
			expect(err).toBe(null);
			expect(blogID).toBe(null);
			expect(task).toBe(null);
			expect(callback).toBe(null);
			done();
		});
	});
});
