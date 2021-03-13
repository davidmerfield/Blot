const debug = require("debug")("blot:helper:queue");
const client = require("client");

// Terminology
// Sources: i.e. users or blogs which generate tasks
// Tasks are jobs, each with a unique source

// Every queue is:
// - Processed in series, one task at a time is processed per source
// - Fair, tasks are processed in round-robin across all sources
// - Reliable, processes can fail without dropping a task
// - Distributed, multiple processes can work on or add to the queue
module.exports = function Queue({ prefix = "" }) {
	// We persist in Redis and take advantage of Redis' features
	// to guarantee certain properties of this queue.
	const keys = {
		sources: {
			// type List // sources with outstanding tasks
			queued: `queue:${prefix}sources:queued`,
			// type List // sources with tasks being processed
			active: `queue:${prefix}sources:active`,
		},

		tasks: {
			// A list of tasks for a particular source that are being processed
			active: (sourceID) => `queue:${prefix}source:${sourceID}:active`,
			// A list of tasks for a particular source that await processing
			queued: (sourceID) => `queue:${prefix}source:${sourceID}:queued`,
			// A list of tasks for a particular source that are done
			ended: (sourceID) => `queue:${prefix}source:${sourceID}:ended`,
		},

		// A set of process ids (pids) for workers on this queue
		processors: `queue:${prefix}processors`,

		// Stores the source ID against the process ID so we can
		// reprocess any tasks for a dead process
		processing: (pid) => `queue:${prefix}processing:${pid}`,

		// Used for inter-process communication about this queue
		channel: `queue:${prefix}channel`,

		// A set of all keys created by this queue for easy cleanup
		all: `queue:${prefix}all`,
	};

	// Number of tasks to store on completed task log
	const MAX_TASK_HISTORY = 1000;

	// Used to enqueue a task.
	this.add = (sourceID, tasks, callback = function () {}) => {
		let serializedTasks;

		// Task must be JSON-ifiable. What if we want to enque
		// a single task that is an array? This is a footgun...
		if (!Array.isArray(tasks)) tasks = [tasks];

		try {
			// Returns a string we can use as a Redis key
			serializedTasks = tasks.map((task) => JSON.stringify(task));
		} catch (e) {
			return callback(new TypeError("Invalid task"));
		}

		let multi = client.multi();

		multi
			// Add the tasks to the list of tasks associated with the source
			.lpush(keys.tasks.queued(sourceID), serializedTasks)
			// Add the keys for the list of tasks associated with the source
			// to the list of all keys associated with this queue so they can
			// be easily cleaned up in future.
			.sadd(
				keys.all,
				keys.tasks.queued(sourceID),
				keys.tasks.active(sourceID),
				keys.tasks.ended(sourceID)
			);

		multi.exec((err) => {
			if (err) return callback(err);

			// Add the source which owns the newly added tasks to the list
			// of all sources with queued or active tasks.
			lpushIfNotPresent(
				keys.sources.queued,
				keys.sources.active,
				sourceID,
				(err) => {
					callback(null);
				}
			);
		});
	};

	// Used to see the state of the queue. Returns information
	// about sources with queued, active and completed tasks.
	this.inspect = (callback) => {
		client
			.batch()
			.smembers(keys.all)
			.smembers(keys.processors)
			.exec((err, [queueKeys, processors]) => {
				if (err) return callback(err);

				let batch = client.batch();

				batch.lrange(keys.sources.queued, 0, -1);

				queueKeys.forEach((queueKey) => {
					batch.lrange(queueKey, 0, -1);
				});

				batch.exec((err, [sources, ...queues]) => {
					if (err) return callback(err);

					let response = { sources, processors };

					queues.forEach((queue, i) => {
						let key = queueKeys[i].split(":");
						let category = key.pop();
						let sourceID = key.pop();
						response[sourceID] = response[sourceID] || {};
						response[sourceID][category] = queue.map(JSON.parse);
					});

					callback(err, response);
				});
			});
	};

	// Used to wipe all information about a queue
	// from the database. Should be called after tests.
	this.destroy = (callback = function () {}) => {
		client
			.batch()
			.smembers(keys.all)
			.smembers(keys.processors)
			.exec((err, [queueKeys, processors]) => {
				if (err) return callback(err);
				client.del(
					[
						keys.sources.queued,
						keys.sources.active,
						keys.processors,
						keys.channel,
						keys.all,
						...processors.map(keys.processing),
						...queueKeys,
					],
					callback
				);
			});
	};

	// Public: used to reattempt the processing function on any task
	// in the processing queue.

	// Questions to answer:
	// - Do we possibly need a new reprocessing client per function?
	// - Can other reprocessing functions clobber this?
	// - Can we eventually only reprocess tasks for the dead worker?
	// - Can we add a timeout for tasks?
	this.reset = (callback = function () {}) => {
		client
			.batch()
			.watch(keys.sources.queued, keys.sources.active)
			.lrange(keys.sources.queued, 0, -1)
			.lrange(keys.sources.active, 0, -1)
			.exec((err, [res, queuedSources, activeSources]) => {
				if (err) return callback(err);

				let sourceIDs = queuedSources.concat(activeSources);

				if (!sourceIDs.length) return callback();

				let activeQueues = sourceIDs.map((sourceID) =>
					keys.tasks.active(sourceID)
				);

				client.watch(activeQueues, (err) => {
					if (err) return callback(err);

					let batch = client.batch();

					sourceIDs.forEach((sourceID) => {
						batch.lrange(keys.tasks.active(sourceID), 0, -1);
					});

					batch.exec((err, res) => {
						if (err) return callback(err);

						let multi = client.multi();

						// Move all active tasks back onto queued task list
						res.forEach((serializedTasks, i) => {
							let sourceID = sourceIDs[i];
							serializedTasks.forEach((serializedTask) => {
								multi
									.lpush(keys.tasks.queued(sourceID), serializedTask)
									.lrem(keys.tasks.active(sourceID), -1, serializedTask);
							});
						});

						// Move all active source IDs onto list of sources with queued jobs
						sourceIDs.forEach((sourceID) => {
							if (activeSources.indexOf(sourceID) === -1) return;
							multi
								.lpush(keys.sources.queued, sourceID)
								.lrem(keys.sources.active, -1, sourceID);
						});

						multi.exec((err, res) => {
							if (err) return callback(err);

							// Something changed, re-attempt to reprocess each source
							if (res === null) {
								this.reset(callback);
							} else {
								// Is this problematic? What if the process recovers?
								// If we call 'reset' in a master process
								// it might not have registered its own processor function
								if (this.processor) this.process();

								callback();
							}
						});
					});
				});
			});
	};

	this.reprocess = (pid, callback = function () {}) => {
		client.watch(
			keys.processing(pid),
			keys.sources.queued,
			keys.sources.active,
			(err) => {
				if (err) return callback(err);
				client.get(keys.processing(pid), (err, sourceID) => {
					if (err) return callback(err);

					let multi = client
						.multi()
						.del(keys.processing(pid))
						.srem(keys.processors, pid);

					if (sourceID) {
						multi
							.lpush(keys.sources.queued, sourceID)
							.lrem(keys.sources.active, -1, sourceID)
							.rpoplpush(
								keys.tasks.active(sourceID),
								keys.tasks.queued(sourceID)
							);
					}

					multi.exec((err, res) => {
						if (err) return callback(err);
						if (res === null) {
							this.reprocess(pid, callback);
						} else {
							// Is this problematic? What if the process recovers?
							// If we call 'reset' in a master process
							// it might not have registered its own processor function
							if (this.processor) this.process();

							callback(null);
						}
					});
				});
			}
		);
	};

	this.drain = (onDrain) => {
		client
			.duplicate()
			.on("message", (channel, sourceID) => {
				if (channel !== keys.channel) return;
				onDrain(sourceID);
			})
			.subscribe(keys.channel);
	};

	// Public method which accepts as only argument an asynchronous
	// function that will do work on a given task. It will wait
	// until there is a source with a task to work on.
	const waitingClient = client.duplicate();

	const waitForTask = (callback) => {
		waitingClient.brpoplpush(
			keys.sources.queued,
			keys.sources.active,
			0, // timeout for the blocking rpop lpush set to infinity!
			(err, sourceID) => {
				client.set(keys.processing(process.pid), sourceID, (err) => {
					if (err) return callback(err);
					client.rpoplpush(
						keys.tasks.queued(sourceID),
						keys.tasks.active(sourceID),
						(err, serializedTask) => {
							if (err) return callback(err);
							callback(null, sourceID, serializedTask);
						}
					);
				});
			}
		);
	};

	// There are no other functions processing tasks for this source
	// However, it is possible to add tasks to this source's queue.
	const checkIfSourceIsDrained = (sourceID, callback = function () {}) => {
		client.watch(keys.tasks.queued(sourceID), (err) => {
			if (err) return callback(err);

			client.llen(keys.tasks.queued(sourceID), (err, totalQueuedTasks) => {
				if (err) return callback(err);

				let multi = client.multi();

				// There are no more tasks for this source, drain is go!
				if (totalQueuedTasks === 0) {
					multi
						.lrem(keys.sources.active, -1, sourceID)
						.lrem(keys.sources.queued, -1, sourceID)
						.publish(keys.channel, sourceID);
				} else {
					multi
						.lrem(keys.sources.active, -1, sourceID)
						.lpush(keys.sources.queued, sourceID);
				}

				multi.exec((err, res) => {
					if (err) return callback(err);

					// Something changed, re-attempt to add these tasks
					if (res === null) {
						checkIfSourceIsDrained(sourceID, callback);
					} else {
						callback(null);
					}
				});
			});
		});
	};

	this.process = (processor) => {
		if (processor) this.processor = processor;
		client
			.multi()
			.sadd(keys.processors, process.pid)
			.exec((err) => {
				waitForTask((err, sourceID, serializedTask) => {
					this.processor(sourceID, JSON.parse(serializedTask), (err) => {
						client
							.multi()
							.lrem(keys.tasks.active(sourceID), -1, serializedTask)
							.lpush(keys.tasks.ended(sourceID), serializedTask)
							.ltrim(keys.tasks.ended(sourceID), 0, MAX_TASK_HISTORY - 1)
							.exec((err) => {
								if (err) debug(err);
								checkIfSourceIsDrained(sourceID, (err) => {
									this.process();
								});
							});
					});
				});
			});
	};
};

// We use a LUA script to guarantee atomicity
// We can't use WATCH because it doesn't account for
// activities of the same client, which we must deal with
const SCRIPT = `
	local exists = false; 

	for _, value in pairs(redis.call("LRANGE",KEYS[1], 0, -1)) do
	  if (value == ARGV[1]) then exists = true; break; end
	end;

	if (exists) then return 0 end;

	for _, value in pairs(redis.call("LRANGE",KEYS[2], 0, -1)) do
	  if (value == ARGV[1]) then exists = true; break; end
 	end;

	if (exists) then return 0 end;

	redis.call("LPUSH", KEYS[1], ARGV[1]);
	return 1`;

let SHA;

function lpushIfNotPresent(firstList, secondList, item, callback) {
	if (SHA) {
		client.evalsha(SHA, 2, firstList, secondList, item, callback);
	} else {
		client.script("load", SCRIPT, (err, sha) => {
			SHA = sha;
			client.evalsha(SHA, 2, firstList, secondList, item, callback);
		});
	}
}

client.script("load", SCRIPT, (err, sha) => {
	SHA = sha;
});
