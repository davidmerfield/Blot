const client = require("models/client");
const { randomUUID } = require("crypto");
const scheduler = require("node-schedule");
const clfdate = require("helper/clfdate");

// Redis-based coordination primitives for running any number of identical
// processes. Keys passed in are used verbatim (callers namespace them), except
// cron, which builds its own. All durations are in milliseconds.
//
//   lock    exclusive while held: at most one holder at a time, and a holder
//           whose key expired can never release or extend someone else's lock.
//   once    at most once: the first caller within the TTL wins, nobody else.
//   cron    at most once per scheduled run: every process registers the same
//           job and one of them wins the run.
//   lease   one holder at a time of a continuous loop, with takeover by
//           another process about one ttl after the holder dies.
//
// The lock is a Redis key whose value is a random token, ending in
// ":<acquired at, ms>" so heldSince() can tell how long it has been held
// without a second key: the scripts below only ever compare the whole value
// for equality, so the suffix changes nothing for them. While held, a
// heartbeat re-extends the TTL; if the process dies the key simply expires.

const ACQUIRE = `
if redis.call("SET", KEYS[1], ARGV[1], "NX", "PX", ARGV[2]) then return 1 end
return 0`;

const EXTEND = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return 0`;

const RELEASE = `
if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) end
return 0`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Logged when a heartbeat tick is this late (the timer fired late, or the
// Redis round trip was slow).
const HEARTBEAT_LOG_THRESHOLD_MS = 500;

// Resolves to { release, token } or rejects with code ELOCKED once retries
// are exhausted. onCompromised(err) fires at most once if the heartbeat finds
// the lock is no longer ours (expired, or Redis unreachable for a full TTL).
async function lock(key, options = {}) {
  const {
    ttl = 10 * 1000,
    heartbeat = 3 * 1000,
    retries = 0,
    minTimeout = 750,
    onCompromised = () => {},
  } = options;

  const token = randomUUID() + ":" + Date.now();

  // Redis starts the PX countdown when it runs ACQUIRE, which is no earlier
  // than startedAt. If the reply took (nearly) a whole ttl to reach us, the
  // key may already have expired and been taken by someone else, so we must
  // not believe it. The margin keeps a reply that arrives with almost no
  // lifetime left from counting as a success.
  const staleAfter = ttl - Math.min(1000, ttl / 10);

  let acquired = false;
  let startedAt;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(minTimeout * Math.pow(2, attempt - 1));
    startedAt = Date.now();
    const ok = await client.eval(ACQUIRE, {
      keys: [key],
      arguments: [token, String(ttl)],
    });
    if (!ok) continue;
    if (Date.now() - startedAt >= staleAfter) {
      console.error(clfdate(), "[LOCK] stale acquire reply", key);
      // Compare-and-delete: harmless if it already expired or isn't ours.
      client
        .eval(RELEASE, { keys: [key], arguments: [token] })
        .catch((e) =>
          console.error(clfdate(), "[LOCK] stale release failed", key, e.message)
        );
      continue;
    }
    acquired = true;
    break;
  }

  if (!acquired) {
    const err = new Error("Lock is held: " + key);
    err.code = "ELOCKED";
    throw err;
  }

  let released = false;
  let compromised = false;
  let inFlight = false;
  // The key's lifetime counts from when Redis ran the script, which is no
  // later than the moment we sent it.
  let lastExtended = startedAt;
  let lastTickAt = Date.now();

  function compromise(err) {
    if (released || compromised) return;
    compromised = true;
    clearInterval(timer);
    err.code = "ECOMPROMISED";
    onCompromised(err);
  }

  const timer = setInterval(async () => {
    if (released || compromised) return;
    // Watchdog, independent of any Redis reply: if a full ttl has passed
    // since the last confirmed extension the key has expired as far as we
    // can tell, however many commands are still pending on a stalled
    // connection.
    if (Date.now() - lastExtended >= ttl) {
      compromise(new Error("Lock heartbeat stalled: " + key));
      return;
    }
    // Never stack EXTENDs behind a stalled one.
    if (inFlight) return;
    inFlight = true;

    // Redis starts the new TTL when it runs the script, so measure from
    // before the round trip; a delayed reply must not lengthen our lease.
    const attemptedAt = Date.now();
    const tickDelayMs = attemptedAt - lastTickAt - heartbeat;
    lastTickAt = attemptedAt;

    try {
      const ok = await client.eval(EXTEND, {
        keys: [key],
        arguments: [token, String(ttl)],
      });
      // A reply after compromise or release is too late to mean anything.
      if (released || compromised) return;
      const roundTripMs = Date.now() - attemptedAt;
      if (
        tickDelayMs >= HEARTBEAT_LOG_THRESHOLD_MS ||
        roundTripMs >= HEARTBEAT_LOG_THRESHOLD_MS
      ) {
        console.log(
          clfdate(),
          "[LOCK] slow heartbeat",
          key,
          `tickDelay=${tickDelayMs}ms`,
          `roundTrip=${roundTripMs}ms`
        );
      }
      if (ok) {
        lastExtended = attemptedAt;
      } else {
        compromise(new Error("Lock was lost: " + key));
      }
    } catch (e) {
      // Redis hiccup: nothing to do, the watchdog gives up once the TTL has
      // really elapsed, since until then nobody else can have taken the lock.
      console.error(clfdate(), "[LOCK] heartbeat error", key, e.message);
    } finally {
      inFlight = false;
    }
  }, heartbeat);
  timer.unref();

  return {
    token,
    async release() {
      if (released) return;
      released = true;
      clearInterval(timer);
      const deleted = await client.eval(RELEASE, {
        keys: [key],
        arguments: [token],
      });
      if (!deleted && !compromised) {
        compromised = true;
        const err = new Error("Lock was lost before release: " + key);
        err.code = "ECOMPROMISED";
        onCompromised(err);
        throw err;
      }
    },
  };
}

// Reports who holds a lock and for how long it will live, for diagnostics.
async function inspect(key) {
  const [holder, ttlMs] = await Promise.all([
    client.get(key),
    client.pTTL(key),
  ]);
  return { lockKey: key, held: holder !== null, holder, ttlMs };
}

// When the current holder acquired the lock (ms since epoch), or null if it
// isn't held or the value has no timestamp suffix.
async function heldSince(key) {
  const holder = await client.get(key);
  const match = typeof holder === "string" && /^[^:]+:(\d{10,})$/.exec(holder);
  return match ? Number(match[1]) : null;
}

// Resolves true if this caller set the key, false if it was already set.
// There is nothing to release: the key expires after ttl. Rejects on Redis
// errors so the caller decides what a failure means.
async function once(key, ttl) {
  const result = await client.set(key, "1", { NX: true, PX: ttl });
  return result !== null;
}

const SCOPES = ["cluster", "host"];

function cronKey(name, fireDate, scope) {
  let key = "cron:" + name + ":" + fireDate.toISOString();
  if (scope === "host") key += ":" + process.env.BLOT_HOST_ID;
  return key;
}

function checkScope(scope) {
  if (!SCOPES.includes(scope))
    throw new Error("lock.cron: scope must be one of " + SCOPES.join(", "));
  // Inside Docker os.hostname() is the container ID, which would differ per
  // container on the same host, so there is deliberately no fallback to it.
  if (scope === "host" && !process.env.BLOT_HOST_ID)
    throw new Error('lock.cron: scope "host" requires BLOT_HOST_ID to be set');
}

// What runs when a cron job fires. Every process derives the same key from
// the fire date node-schedule passes in (not Date.now(), so a process that
// fires late still agrees), and only the winner runs fn. Never throws: errors
// from Redis or fn are logged. Resolves true if fn ran to completion here.
async function fire(name, fireDate, fn, options = {}) {
  // The marker must outlive any late firing: a process whose event loop or
  // container was suspended still gets the original fireDate from
  // node-schedule when it wakes, and must find the marker. The keys are tiny.
  const { scope = "cluster", ttl = 24 * 60 * 60 * 1000 } = options;
  try {
    checkScope(scope);
    const won = await once(cronKey(name, fireDate, scope), ttl);
    if (!won) return false;
    await fn(fireDate);
    return true;
  } catch (e) {
    console.error(
      clfdate(),
      "[CRON]",
      name,
      "failed:",
      e && e.stack ? e.stack : e
    );
    return false;
  }
}

// Returns the node-schedule Job so callers can cancel it. Throws at
// registration time for a bad scope or a missing BLOT_HOST_ID.
function cron(name, rule, fn, options = {}) {
  checkScope(options.scope || "cluster");
  return scheduler.scheduleJob(rule, (fireDate) =>
    fire(name, fireDate, fn, options)
  );
}

cron._fire = fire;

// Keeps trying to be the single holder of a continuous loop. fn(signal) runs
// while we hold the lock; signal aborts if the lock is compromised or stop()
// is called, and fn should then wind down. When fn settles we release, wait
// retryEvery and try again, as we do when someone else holds it. stop()
// resolves once fully stopped (including fn returning, if it was running).
function lease(key, fn, options = {}) {
  const {
    ttl = 10 * 1000,
    heartbeat = 3 * 1000,
    // A standby tries again about when the holder's key can have expired.
    retryEvery = ttl,
  } = options;

  let stopped = false;
  let current = null; // AbortController of the run in progress
  let wake = null; // cuts the current wait short

  const wait = (ms) =>
    new Promise((resolve) => {
      const timer = setTimeout(done, ms);
      timer.unref();
      function done() {
        clearTimeout(timer);
        wake = null;
        resolve();
      }
      wake = done;
    });

  async function loop() {
    while (!stopped) {
      const controller = new AbortController();
      let held = null;
      try {
        held = await lock(key, {
          ttl,
          heartbeat,
          onCompromised: (err) => {
            console.error(clfdate(), "[LEASE] lost", key, err.message);
            controller.abort();
          },
        });
      } catch (e) {
        if (e.code !== "ELOCKED")
          console.error(clfdate(), "[LEASE] could not lock", key, e.message);
      }

      if (held) {
        current = controller;
        // stop() may have been called while we were acquiring
        if (!stopped) {
          try {
            await fn(controller.signal);
          } catch (e) {
            console.error(
              clfdate(),
              "[LEASE]",
              key,
              "failed:",
              e && e.stack ? e.stack : e
            );
          }
        }
        current = null;
        // Anything watching the signal sees it end with the run.
        controller.abort();
        try {
          await held.release();
        } catch (e) {
          if (e.code !== "ECOMPROMISED")
            console.error(clfdate(), "[LEASE] release failed", key, e.message);
        }
      }

      if (!stopped) await wait(retryEvery);
    }
  }

  const running = loop();

  return {
    stop() {
      stopped = true;
      if (current) current.abort();
      if (wake) wake();
      return running;
    },
  };
}

lock.inspect = inspect;
lock.heldSince = heldSince;
lock.once = once;
lock.cron = cron;
lock.lease = lease;

module.exports = lock;
