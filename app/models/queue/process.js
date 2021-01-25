var keys = require("./keys");
var client = require("client");
var async = require("async");
var debug = require("debug")("blot:models:queue");
var PROCESSOR;

// create a queue object with concurrency 1
var internalQueue = async.queue(function (task, done) {
	debug("handling task");
	if (!PROCESSOR) {
		debug("there is no processing funtion for this task");
		return done();
	}

	client.RPOPLPUSH(keys.blogs, keys.blogs, function (err, blogID) {
		if (!blogID) {
			debug("there are no blogs to process");
			return done();
		}

		client.RPOPLPUSH(keys.blog(blogID), keys.processing, function (err, key) {
			if (!key) {
				debug("there are no tasks for the blog " + blogID + "to process");

				// we need to check if the blog queue is empty
				// and if so remove it from the list of blogs
				// to process

				return client.lrem(keys.blogs, -1, blogID, function (err) {
					// emit flushed queue
					done();
				});
			}

			debug("handing off to task to processing function");

			PROCESSOR(blogID, JSON.parse(key.slice(key.indexOf(":") + 1)), function (
				err
			) {
				// task completed with error
				if (err) {
					// task completed with success
					done();
				} else {
					debug("task completed successfully");
					client
						.multi()
						.lrem(keys.processing, -1, key)
						.lpush(keys.completed, key)
						.exec(function (err) {
							done();
						});
				}
			});
		});
	});
});

var otherClient = require("redis").createClient();

otherClient.subscribe(keys.channel);

otherClient.on("message", function () {
	debug("adding task to internalQueue");

	internalQueue.push({ name: "foo" });
});

module.exports = function (processor) {
	PROCESSOR = processor;
	debug("adding initial task to internalQueue");
	internalQueue.push({ name: "foo" });
};
