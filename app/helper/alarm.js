const client = require("models/client");
const clfdate = require("helper/clfdate");
const { isRedisUnavailableError } = require("helper/redisUnavailable");

// Alarms held in Redis that any process can claim: an alarm is set for a
// time, can be reset or cancelled, and fires once - in exactly one of any
// number of processes. It replaces per-process in-memory timers, which had
// to be rebuilt at boot and only ran in one container.
//
//   const alarms = alarm("scheduled-entries", async (id) => {...});
//   await alarms.set(id, when);  // replaces any existing alarm for id
//   alarms.start();              // poll for due alarms every pollMs
//
// Each name is one sorted set, alarm:<name>: member = id, score = due time
// in ms. There is no payload; the handler re-reads state when it fires.
//
// Delivery is at-least-once, so handlers must be idempotent. A poll claims
// due ids by moving their score to now + leaseMs, which stops other
// processes claiming them while this one handles them. If the handler
// throws, or the process dies, the id simply becomes due again once the
// lease runs out and is retried by whichever process polls next. When the
// handler succeeds the id is removed only if its score is still the one we
// claimed, so an alarm set again during handling (a post rescheduled while
// it was publishing) survives with its new time.

const CLAIM = `
local due = redis.call("ZRANGEBYSCORE", KEYS[1], "-inf", ARGV[1], "LIMIT", 0, tonumber(ARGV[3]))
local lease = tonumber(ARGV[1]) + tonumber(ARGV[2])
for _, member in ipairs(due) do
  redis.call("ZADD", KEYS[1], lease, member)
end
return due`;

const COMPLETE = `
local score = redis.call("ZSCORE", KEYS[1], ARGV[1])
if score and tonumber(score) == tonumber(ARGV[2]) then
  return redis.call("ZREM", KEYS[1], ARGV[1])
end
return 0`;

function toMs(when) {
  const ms = when instanceof Date ? when.getTime() : when;
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    throw new TypeError("alarm: when must be a Date or a finite ms timestamp");
  }
  return ms;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value) {
    throw new TypeError("alarm: " + label + " must be a non-empty string");
  }
  return value;
}

module.exports = function alarm(name, handler, options = {}) {
  requireString(name, "name");
  if (typeof handler !== "function") {
    throw new TypeError("alarm: handler must be a function");
  }

  const {
    pollMs = 5000,
    leaseMs = 60000,
    batch = 10,
    now = () => Date.now(),
  } = options;

  const key = "alarm:" + name;
  let timer = null;
  let inFlight = null;

  function log(message, err) {
    console.log(clfdate(), "[alarm]", name, message, err ? err.message : "");
  }

  async function set(id, when) {
    requireString(id, "id");
    await client.zAdd(key, { score: toMs(when), value: id });
  }

  async function cancel(id) {
    requireString(id, "id");
    await client.zRem(key, id);
  }

  async function when(id) {
    requireString(id, "id");
    const score = await client.zScore(key, id);
    return score === null || score === undefined ? null : Number(score);
  }

  async function run() {
    const claimedAt = now();
    const claimedScore = claimedAt + leaseMs;
    let ids;

    try {
      ids = await client.eval(CLAIM, {
        keys: [key],
        arguments: [String(claimedAt), String(leaseMs), String(batch)],
      });
    } catch (err) {
      log(isRedisUnavailableError(err) ? "Redis unavailable:" : "claim failed:", err);
      return 0;
    }

    let handled = 0;

    for (const id of ids) {
      try {
        await handler(id);
      } catch (err) {
        // Left in place: it becomes due again when the lease expires
        log("handler failed for " + id + ":", err);
        continue;
      }

      handled++;

      try {
        await client.eval(COMPLETE, {
          keys: [key],
          arguments: [id, String(claimedScore)],
        });
      } catch (err) {
        // The handler ran, so it will run again after the lease
        log("could not clear " + id + ":", err);
      }
    }

    return handled;
  }

  // Resolves to the number of ids handled successfully. Calls made while a
  // poll is running share that poll rather than starting another.
  function poll() {
    if (inFlight) return inFlight;
    inFlight = run().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      poll().catch((err) => log("poll failed:", err));
    }, pollMs);
    timer.unref();
  }

  async function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (inFlight) await inFlight.catch(() => {});
  }

  return { set, cancel, when, start, stop, poll };
};
