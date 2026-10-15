const lock = require("helper/lock");

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
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
// in every other process (and in later restarts of the same release within
// the ttl). Used for startup one-offs that must not be repeated by every
// container. Rejects on Redis errors; callers decide what that means.
function onceAtStartup(name, ttl = ONE_HOUR_IN_MS) {
  return lock.once("startup:" + name + ":" + releaseId(), ttl);
}

module.exports = onceAtStartup;
module.exports.releaseId = releaseId;
