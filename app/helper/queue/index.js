const debug = require("debug")("blot:helper:queue");
const client = require("models/client");

// Terminology
// Sources generate tasks, they are effectively users/blogs/tenants
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
      queued: `queue:${prefix}:sources:queued`,
      // type List // sources with tasks being processed
      active: `queue:${prefix}:sources:active`,
    },

    tasks: {
      // A list of tasks for a particular source that are being processed
      active: (sourceID) => `queue:${prefix}:source:${sourceID}:active`,
      // A list of tasks for a particular source that await processing
      queued: (sourceID) => `queue:${prefix}:source:${sourceID}:queued`,
      // A list of tasks for a particular source that are done
      ended: (sourceID) => `queue:${prefix}:source:${sourceID}:ended`,
    },

    processor: {
      // Stores a number, which is incremeneted each heartbeat
      heartbeat: (pid) => `queue:${prefix}:processor:${pid}:heartbeat`,

      // Stores the source ID against the process ID so we can
      // reprocess any tasks for a dead process
      source: (pid) => `queue:${prefix}:processor:${pid}:source`,

      // A set of process ids (pids) for workers on this queue
      all: `queue:${prefix}:processor:all`,
    },

    // Used for inter-process communication about this queue
    channel: `queue:${prefix}:channel`,

    // A set of all keys created by this queue for easy cleanup
    all: `queue:${prefix}:all`,
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
      .smembers(keys.processor.all)
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
      .smembers(keys.processor.all)
      .exec((err, [queueKeys, processors]) => {
        if (err) return callback(err);
        client.del(
          [
            keys.sources.queued,
            keys.sources.active,
            keys.processor.all,
            keys.channel,
            keys.all,
            ...processors.map(keys.processor.source),
            ...processors.map(keys.processor.heartbeat),
            ...queueKeys,
          ],
          callback
        );
      });
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

  const reprocess = (pid, callback = function () {}) => {
    client.watch(
      keys.processor.source(pid),
      keys.sources.queued,
      keys.sources.active,
      (err) => {
        if (err) return callback(err);
        client.get(keys.processor.source(pid), (err, sourceID) => {
          if (err) return callback(err);

          let multi = client
            .multi()
            .del(keys.processor.source(pid))
            .del(keys.processor.heartbeat(pid))
            .srem(keys.processor.all, pid);

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
              reprocess(pid, callback);
            } else {
              callback(null);
            }
          });
        });
      }
    );
  };

  const waitingClient = client.duplicate();

  const waitForTask = (callback) => {
    waitingClient.brpoplpush(
      keys.sources.queued,
      keys.sources.active,
      0, // timeout for the blocking rpop lpush set to infinity!
      (err, sourceID) => {
        client.set(keys.processor.source(process.pid), sourceID, (err) => {
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

  const HEARTBEAT_INTERVAL = 300;

  // Emit a heartbeat so others can verify this process is healthy
  const heartbeat = () => {
    client.incr(keys.processor.heartbeat(process.pid), (err) => {
      setTimeout(heartbeat, HEARTBEAT_INTERVAL);
    });
  };

  const HEARTBEAT_CHECK_INTERAL = HEARTBEAT_INTERVAL * 4;

  const monintorHeartbeats = (previousState = {}) => {
    let state = {};
    const done = () => {
      setTimeout(() => monintorHeartbeats(state), HEARTBEAT_CHECK_INTERAL);
    };

    client.smembers(keys.processor.all, (err, processors) => {
      if (err) throw err;

      let heartbeatKeys = processors
        .filter((pid) => pid !== process.pid)
        .map(keys.processor.heartbeat);

      if (heartbeatKeys.length === 0) return done();

      client.mget(heartbeatKeys, (err, heartbeats) => {
        if (err) throw err;
        heartbeats.forEach((heartbeat, index) => {
          let pid = processors[index];
          if (previousState[pid] === heartbeat) return reprocess(pid);
          state[pid] = heartbeat;
        });
        done();
      });
    });
  };

  monintorHeartbeats();

  this.process = (processor) => {
    heartbeat();

    client
      .multi()
      .sadd(keys.processor.all, process.pid)
      .exec((err) => {
        waitForTask((err, sourceID, serializedTask) => {
          processor(sourceID, JSON.parse(serializedTask), (err) => {
            client
              .multi()
              .lrem(keys.tasks.active(sourceID), -1, serializedTask)
              .lpush(keys.tasks.ended(sourceID), serializedTask)
              .ltrim(keys.tasks.ended(sourceID), 0, MAX_TASK_HISTORY - 1)
              .exec((err) => {
                if (err) debug(err);
                checkIfSourceIsDrained(sourceID, (err) => {
                  this.process(processor);
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
