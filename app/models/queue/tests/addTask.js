describe("Queue.addTask", function () {
	global.test.blog();

	afterEach(function (done) {
		require("../reset")(done);
	});

	var CHANNEL_KEY = require("../keys").channel;
	var addTask = require("../addTask");

	it("adds a task", function (done) {
		addTask(this.blog.id, {path: "foo"}, done);
	});

	it("adds multiple tasks", function (done) {
		addTask(this.blog.id, [{path: "foo"}, {path: "bar"}], done);
	});

	it("emits an event when a task is added", function (done) {
		var client = require("redis").createClient();
		client.subscribe(CHANNEL_KEY);
		client.on("message", function () {
			client.unsubscribe(CHANNEL_KEY);
			done();
		});
		addTask(this.blog.id, {path: "foo"}, done);
	});
});
