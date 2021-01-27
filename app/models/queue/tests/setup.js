module.exports = function () {
	global.test.blog();

	var Queue = require("../index");
	// Resets the database for any tasks stored
	beforeEach(function () {
		var prefix = require("helper").hash(Date.now().toString()).slice(0, 10);
		this.queue = new Queue(prefix);
		console.log("queue", this.queue);
	});

	afterEach(function (done) {
		console.log("resetting queue");
		this.queue.destroy(done);
	});
};
