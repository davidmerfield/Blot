describe("Queue.getTask", function () {
	global.test.blog();

	afterEach(function (done) {
		require("../reset")(done);
	});

	var addTask = require("../addTask");
	var getTask = require("../getTask");

	it("gets a task", function (done) {
		var test = this;

		addTask(test.blog.id, "foo", function (err) {
			expect(err).toBe(null);
			getTask(function (err, blogID, path, callback) {
				expect(err).toBe(null);
				expect(blogID).toBe(test.blog.id);
				expect(path).toBe("foo");
				console.log("here!", done);
				callback(null, done);
			});
		});
	});

	it("gets multiple tasks in order", function (done) {
		var test = this;

		addTask(test.blog.id, ["foo", "bar"], function (err) {
			getTask(function (err, blogID, path, callback) {
				expect(path).toBe("foo");
				getTask(function (err, blogID, path, callback) {
					expect(path).toBe("bar");
					callback(null, done);
				});
			});
		});
	});

	it("gets multiple tasks in fair order", function (done) {
		var test = this;

		addTask(test.blog.id, ["foo", "bar"], function (err) {
			addTask("secondblogID", ["baz"], function (err) {
				getTask(function (err, blogID, path, callback) {
					expect(path).toBe("foo");
					getTask(function (err, blogID, path, callback) {
						expect(path).toBe("baz");
						getTask(function (err, blogID, path, callback) {
							expect(path).toBe("bar");
							callback(null, done);
						});
					});
				});
			});
		});
	});

	it("does not error if no task exists", function (done) {
		var test = this;

		getTask(function (err, blogID, path, callback) {
			expect(err).toBe(null);
			expect(blogID).toBe(null);
			expect(path).toBe(null);
			expect(callback).toBe(null);
			done();
		});
	});
});
