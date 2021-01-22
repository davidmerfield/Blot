var keys = require("./keys");
var client = require("client");

var PROCESSOR;
var PROCESSOR_PROCESSING = false;

var otherClient = require("redis").createClient();

otherClient.subscribe(keys.channel);

otherClient.on("message", function () {
	checkForTask();
});

function checkForTask() {
	if (!PROCESSOR) return;
	if (PROCESSOR_PROCESSING);

	client.RPOPLPUSH(keys.blogs, keys.blogs, function (err, blogID) {
		if (!blogID) return;

		if (PROCESSOR_PROCESSING) return;
		PROCESSOR_PROCESSING = true;

		client.RPOPLPUSH(keys.blog(blogID), keys.processing, function (err, key) {
			if (!key) {
				PROCESSOR_PROCESSING = false;
				return client.lrem(keys.blogs, -1, blogID, function (err) {
					// emit flushed queue
				});
			}

			PROCESSOR(blogID, JSON.parse(key.slice(key.indexOf(":") + 1)), function (
				err
			) {
				// task has completed

				client
					.multi()
					.lrem(keys.processing, -1, key)
					.lpush(keys.completed, key)
					.exec(function (err) {
						if (err) throw err;
						PROCESSOR_PROCESSING = false;
						checkForTask();
					});
			});
		});
	});
}

module.exports = function (processor) {
	PROCESSOR = processor;
	PROCESSOR_PROCESSING = false;
	checkForTask();
};
