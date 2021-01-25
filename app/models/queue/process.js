var client = require("client");
var async = require("async");
var debug = require("debug")("blot:models:queue");
var redis = require("redis");
var hash = require("helper").hash;

var otherClient = redis.createClient();

module.exports = function (prefix) {
	var internalQueue;
	var keys = require("./keys")(prefix);

	function taskHandler(processor) {
		var label = hash(processor.toString()).slice(0, 6);

		debug("initing processor:", label);

		return function attempt(task, done) {
			debug("processor:", label, "handling task");
			client.RPOPLPUSH(keys.blogs, keys.blogs, function (err, blogID) {
				if (!blogID) {
					debug("processor:", label, "there are no blogs to process");
					return done();
				}

				client.RPOPLPUSH(keys.blog(blogID), keys.processing, function (
					err,
					key
				) {
					if (!key) {
						
						debug(
							"processor:",
							label,
							"there are no tasks for the blog " +
								blogID +
								" to process, calling done"
						);
						// we need to check if the blog queue is empty
						// and if so remove it from the list of blogs
						// to process
						return client.lrem(keys.blogs, -1, blogID, function (err) {
							// emit flushed queue
						 done();
						});						
					}

					debug(
						"processor:",
						label,
						"handing off to task to processing function"
					);

					processor(
						blogID,
						JSON.parse(key.slice(key.indexOf(":") + 1)),
						function (err) {
							// task completed with error

							if (err) {
								debug("processor:", label, "task completed with error");
								// task completed with success
								debug("processor:", label, "re-attempting check for tasks");
								attempt(null, done);
							} else {
								debug("processor:", label, "task completed successfully");
								client
									.multi()
									.lrem(keys.processing, -1, key)
									.lpush(keys.completed, key)
									.exec(function (err) {
										debug("processor:", label, "re-attempting check for tasks");
										attempt(null, done);
									});
							}
						}
					);
				});
			});
		};
	}

	otherClient.subscribe(keys.channel);

	otherClient.on("message", function () {
		debug("invoked! adding task to internalQueue");
		if (internalQueue) internalQueue.push({ name: "foo" });
	});

	return function (processor) {
		// create a queue object with concurrency 1

		internalQueue = async.queue(taskHandler(processor));

		debug("adding initial task to internalQueue");
		internalQueue.push({ name: "foo" });
	};
};
