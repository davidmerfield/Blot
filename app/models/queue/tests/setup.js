module.exports = function () {
	// Resets the database for any tasks stored
	beforeEach(function () {
		this.queue = require("../index")(
			require("helper").hash(Date.now().toString()).slice(0, 10)
		);
	});

	afterEach(function () {
		this.queue.reset();
	});
};
