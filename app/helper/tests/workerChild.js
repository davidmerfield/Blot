describe("workerChild", function () {
  const EventEmitter = require("events");
  const workerChild = require("helper/workerChild");

  let forks, supervisor;

  // Stands in for child_process.fork: records each fork and lets the spec
  // end the child, as an exit or a kill would
  function fakeFork(script, args, options) {
    const child = new EventEmitter();
    child.pid = 1000 + forks.length;
    child.script = script;
    child.options = options;
    child.kill = jasmine.createSpy("kill").and.callFake(function (signal) {
      setImmediate(() => child.emit("exit", 0, null));
    });
    forks.push(child);
    return child;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function start(options = {}) {
    supervisor = workerChild(
      Object.assign(
        {
          script: "/app/index.js",
          socket: "/run/blot/a-worker.sock",
          fork: fakeFork,
          env: { CONTAINER_NAME: "blot-container-a", BLOT_ROLE: "web", BLOT_WORKER_SOCKET: "/run/blot/a-worker.sock" },
          minBackoffMs: 20,
          maxBackoffMs: 80,
          stableMs: 1000,
        },
        options
      )
    );
    return supervisor;
  }

  beforeEach(function () {
    forks = [];
    spyOn(console, "log");
  });

  afterEach(async function () {
    if (supervisor) await supervisor.stop();
    supervisor = null;
  });

  it("forks the script as a worker serving on the socket", function () {
    start({ maxOldSpaceSize: 900, drainTimeoutMs: 25000 });

    expect(forks.length).toBe(1);
    const { env, execArgv } = forks[0].options;
    expect(forks[0].script).toBe("/app/index.js");
    expect(env.BLOT_ROLE).toBe("worker");
    expect(env.BLOT_WORKER_CHILD).toBe("true");
    expect(env.BLOT_SOCKET).toBe("/run/blot/a-worker.sock");
    expect(env.BLOT_WORKER_SOCKET).toBe("");
    expect(env.CONTAINER_NAME).toBe("blot-container-a");
    expect(env.BLOT_DRAIN_TIMEOUT_MS).toBe("22000");
    expect(execArgv).toContain("--max-old-space-size=900");
  });

  it("forks it again after it exits, backing off", async function () {
    start();

    forks[0].emit("exit", 1, null);
    expect(forks.length).toBe(1);
    await wait(40);
    expect(forks.length).toBe(2);

    // The second delay is double the first
    forks[1].emit("exit", 1, null);
    await wait(25);
    expect(forks.length).toBe(2);
    await wait(40);
    expect(forks.length).toBe(3);
  });

  it("stops the child with SIGTERM and resolves once it has exited", async function () {
    start();

    await supervisor.stop();

    expect(forks[0].kill).toHaveBeenCalledWith("SIGTERM");
    expect(supervisor.pid).toBe(null);
  });

  it("forks nothing more once stopped, even while a restart is pending", async function () {
    start();

    forks[0].emit("exit", 1, null);
    await supervisor.stop();
    await wait(60);

    expect(forks.length).toBe(1);
  });
});
