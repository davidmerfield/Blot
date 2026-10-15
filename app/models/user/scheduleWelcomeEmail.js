const ensure = require("helper/ensure");
const debug = require("debug")("blot:user:scheduleWelcomeEmail");
const alarm = require("helper/alarm");
const lock = require("helper/lock");
const client = require("models/client");

const email = require("helper/email");
const getById = require("./getById");
const set = require("./set");

const WELCOME_EMAIL_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

// Long enough that no retry of the alarm can outlive it
const SENT_MARKER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sentKey(uid) {
  return "welcome-email:sent:" + uid;
}

function getCreatedDate(user) {
  if (!user) return new Date();

  if (typeof user.created === "number") {
    return new Date(user.created);
  }

  if (typeof user.created === "string") {
    const parsed = Date.parse(user.created);

    if (!Number.isNaN(parsed)) return new Date(parsed);
  }

  return new Date();
}

function getUser(uid) {
  return new Promise(function (resolve, reject) {
    getById(uid, function (err, user) {
      if (err) return reject(err);
      resolve(user);
    });
  });
}

function sendWelcome(uid) {
  return new Promise(function (resolve, reject) {
    email.WELCOME(uid, {}, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function setUser(uid, updates) {
  return new Promise(function (resolve, reject) {
    set(uid, updates, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Runs in whichever process claims the alarm, and again if the alarm is
// retried, so it must be safe to run twice (even at the same time): the
// Redis marker lets only one run send. If the send fails the marker is
// removed so the retry can send; if the process dies mid-send the marker
// stays and the email is not sent twice.
async function handler(uid) {
  const user = await getUser(uid);

  if (!user || user.welcomeEmailSent) return;

  const won = await lock.once(sentKey(uid), SENT_MARKER_TTL_MS);

  if (!won) return;

  try {
    await sendWelcome(uid);
  } catch (err) {
    debug(uid, "Failed to send welcome email", err);
    await client.del(sentKey(uid));
    throw err;
  }

  await setUser(uid, { welcomeEmailSent: true });
  debug(uid, "Welcome email sent and recorded");
}

const alarms = alarm("welcome-email", handler);

function scheduleWelcomeEmail(uid, callback = function () {}) {
  try {
    ensure(uid, "string").and(callback, "function");
  } catch (err) {
    return callback(err);
  }

  getById(uid, function (err, user) {
    if (err) return callback(err);

    if (!user) return callback(new Error("No user"));

    if (user.welcomeEmailSent) {
      debug(uid, "Welcome email already sent, cancelling alarm");
      return alarms.cancel(uid).then(function () {
        callback();
      }, callback);
    }

    // A time in the past is claimed on the next poll
    const scheduledTime = new Date(
      getCreatedDate(user).getTime() + WELCOME_EMAIL_DELAY_MS
    );

    alarms.set(uid, scheduledTime).then(function () {
      debug(uid, "Scheduled welcome email for", scheduledTime);
      callback();
    }, callback);
  });
}

scheduleWelcomeEmail.alarm = alarms;
scheduleWelcomeEmail.handler = handler;
scheduleWelcomeEmail.sentKey = sentKey;
scheduleWelcomeEmail.WELCOME_EMAIL_DELAY_MS = WELCOME_EMAIL_DELAY_MS;

module.exports = scheduleWelcomeEmail;
