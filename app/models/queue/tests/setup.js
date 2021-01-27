module.exports = function () {
	global.test.blog();

	var Queue = require("../index");

	beforeEach(function () {
		this.queue = new Queue(
			require("helper").hash(Date.now().toString()).slice(0, 10)
		);
	});

	afterEach(function (done) {
		this.queue.destroy(done);
	});
};
