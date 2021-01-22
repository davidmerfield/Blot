module.exports = function () {
	global.test.blog();

	// Resets the processor function for the queue
	beforeEach(function () {
		require("../process")();
	});

	// Resets the database for any tasks stored
	afterEach(function (done) {
		require("../reset")(done);
	});
};
