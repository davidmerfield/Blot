const lock = require("helper/lock");

const FIFTEEN_MINUTES_IN_MS = 15 * 60 * 1000;

// Identifies the deploy this process belongs to. The deploy script passes the
// image commit hash as BLOT_RELEASE_ID (GIT_SHA is the fallback), the same
// value app/index.js uses for its start notification. Without either, fall
// back to a 15 minute bucket so processes starting together still agree.
function releaseId(now = Date.now()) {
  const id = process.env.BLOT_RELEASE_ID || process.env.GIT_SHA;
  if (id) return id;
  return "t" + Math.floor(now / FIFTEEN_MINUTES_IN_MS);
}

// Resolves true in the first process of a deploy to ask for this name, false
// in every other process starting within the ttl. Used for startup one-offs
// that must not be repeated by every container. The ttl only needs to cover
// containers starting together during a deploy: a crash-restart later on
// should run them again (e.g. Dropbox's resync of blogs that were syncing).
// Rejects on Redis errors; callers decide what that means.
function onceAtStartup(name, ttl = FIFTEEN_MINUTES_IN_MS) {
  return lock.once("startup:" + name + ":" + releaseId(), ttl);
}

module.exports = onceAtStartup;
module.exports.releaseId = releaseId;
