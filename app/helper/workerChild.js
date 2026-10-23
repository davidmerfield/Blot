const childProcess = require("child_process");
const clfdate = require("helper/clfdate");

// Forks a worker child from a web process and keeps it running (#2119).
//
// The child runs the same app (script) with BLOT_ROLE=worker, so it runs the
// scheduler, the sync clients' background jobs and follow-up syncs, which
// the web parent doesn't (see app/setup.js). It serves HTTP on its own Unix
// socket only, for the reverse proxy to send it the requests that sync or
// build (webhooks, /clients, dashboard writes), so they never block the web
// process's event loop.
//
// A child that exits is forked again after a delay that doubles from
// minBackoffMs to maxBackoffMs, and starts again from minBackoffMs once a
// child has run for stableMs. stop() sends it SIGTERM, which the child
// handles with its own drain (helper/drain), and resolves once it has
// exited. Its drain timeout is shorter than the parent's, so it is done
// before the parent's drain gives up waiting.
const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30 * 1000;
const STABLE_MS = 60 * 1000;
const DRAIN_MARGIN_MS = 3000;

module.exports = function workerChild({
  script,
  socket,
  maxOldSpaceSize = null,
  drainTimeoutMs,
  env = process.env,
  fork = childProcess.fork,
  minBackoffMs = MIN_BACKOFF_MS,
  maxBackoffMs = MAX_BACKOFF_MS,
  stableMs = STABLE_MS,
}) {
  if (!script) throw new TypeError("workerChild: script is required");
  if (!socket) throw new TypeError("workerChild: socket is required");

  const log = (...args) => console.log(clfdate(), "[WORKER]", ...args);

  let child = null;
  let stopping = false;
  let restartTimer = null;
  let backoffMs = minBackoffMs;

  const childEnv = Object.assign({}, env, {
    BLOT_ROLE: "worker",
    BLOT_WORKER_CHILD: "true",
    BLOT_SOCKET: socket,
    BLOT_WORKER_SOCKET: "",
  });

  if (drainTimeoutMs) {
    childEnv.BLOT_DRAIN_TIMEOUT_MS = String(
      Math.max(1000, drainTimeoutMs - DRAIN_MARGIN_MS)
    );
  }

  // Command-line flags win over the NODE_OPTIONS the child inherits, so this
  // gives it its own heap cap rather than the parent's
  const execArgv = process.execArgv.concat(
    maxOldSpaceSize ? ["--max-old-space-size=" + maxOldSpaceSize] : []
  );

  function start() {
    restartTimer = null;
    const startedAt = Date.now();
    const forked = fork(script, [], { env: childEnv, execArgv });
    child = forked;
    log("Started", "pid=" + forked.pid);

    forked.on("exit", function (code, signal) {
      if (child === forked) child = null;
      if (stopping) return;

      if (Date.now() - startedAt >= stableMs) backoffMs = minBackoffMs;

      log(
        "Exited",
        "pid=" + forked.pid,
        "code=" + code,
        "signal=" + signal,
        "restarting in " + backoffMs + "ms"
      );

      restartTimer = setTimeout(start, backoffMs);
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
    });
  }

  function stop() {
    stopping = true;
    if (restartTimer) clearTimeout(restartTimer);
    restartTimer = null;

    const running = child;
    if (!running) return Promise.resolve();

    return new Promise(function (resolve) {
      running.once("exit", resolve);
      log("Stopping", "pid=" + running.pid);
      running.kill("SIGTERM");
    });
  }

  start();

  return {
    stop,
    get pid() {
      return child ? child.pid : null;
    },
  };
};
