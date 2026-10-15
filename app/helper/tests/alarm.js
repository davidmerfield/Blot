describe("alarm", function () {
  const alarm = require("helper/alarm");
  const client = require("models/client");
  const { randomUUID } = require("crypto");

  beforeEach(function () {
    const spec = this;
    spec.name = "test-" + randomUUID();
    spec.t = 1000000; // fake clock, ms

    // Instances in a spec share a name, as two processes would
    spec.make = function (handler, options = {}) {
      return alarm(
        spec.name,
        handler,
        Object.assign({ now: () => spec.t }, options)
      );
    };
  });

  afterEach(async function () {
    await client.del("alarm:" + this.name);
  });

  it("does not call the handler before the alarm is due, then handles it once", async function () {
    const calls = [];
    const alarms = this.make(async (id) => calls.push(id));

    await alarms.set("a", this.t + 100);
    expect(await alarms.poll()).toEqual(0);
    expect(calls).toEqual([]);

    this.t += 100;
    expect(await alarms.poll()).toEqual(1);
    expect(calls).toEqual(["a"]);
    expect(await alarms.when("a")).toBe(null);

    expect(await alarms.poll()).toEqual(0);
    expect(calls).toEqual(["a"]);
  });

  it("set replaces an existing time, cancel removes, when reports it", async function () {
    const alarms = this.make(async () => {});

    expect(await alarms.when("a")).toBe(null);
    await alarms.set("a", this.t + 100);
    expect(await alarms.when("a")).toEqual(this.t + 100);

    await alarms.set("a", new Date(this.t + 500));
    expect(await alarms.when("a")).toEqual(this.t + 500);

    await alarms.cancel("a");
    expect(await alarms.when("a")).toBe(null);
    await alarms.cancel("a");
  });

  it("validates its arguments", async function () {
    const alarms = this.make(async () => {});

    expect(() => alarm("", async () => {})).toThrow();
    expect(() => alarm("x", null)).toThrow();
    await expectAsync(alarms.set("", 1)).toBeRejected();
    await expectAsync(alarms.set("a", NaN)).toBeRejected();
    await expectAsync(alarms.set("a", new Date("nope"))).toBeRejected();
    await expectAsync(alarms.set("a", "soon")).toBeRejected();
    await expectAsync(alarms.cancel(5)).toBeRejected();
  });

  it("handles each due id exactly once across two instances", async function () {
    const calls = [];
    const handler = async (id) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      calls.push(id);
    };
    const one = this.make(handler, { batch: 3 });
    const two = this.make(handler, { batch: 3 });
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];

    for (const id of ids) await one.set(id, this.t);

    let total = 0;
    for (let i = 0; i < 4; i++) {
      const counts = await Promise.all([one.poll(), two.poll()]);
      total += counts[0] + counts[1];
    }

    expect(calls.slice().sort()).toEqual(ids);
    expect(total).toEqual(ids.length);
  });

  it("retries a failed handler only after the lease expires", async function () {
    let attempts = 0;
    const alarms = this.make(
      async () => {
        attempts++;
        if (attempts === 1) throw new Error("boom");
      },
      { leaseMs: 1000 }
    );
    spyOn(console, "log");

    await alarms.set("a", this.t);
    expect(await alarms.poll()).toEqual(0);
    expect(attempts).toEqual(1);
    expect(await alarms.when("a")).toEqual(this.t + 1000);

    this.t += 999;
    expect(await alarms.poll()).toEqual(0);
    expect(attempts).toEqual(1);

    this.t += 1;
    expect(await alarms.poll()).toEqual(1);
    expect(attempts).toEqual(2);
    expect(await alarms.when("a")).toBe(null);
  });

  it("keeps an alarm that was set again while it was being handled", async function () {
    const later = this.t + 5000;
    const alarms = this.make(async (id) => {
      await alarms.set(id, later);
    });

    await alarms.set("a", this.t);
    expect(await alarms.poll()).toEqual(1);
    expect(await alarms.when("a")).toEqual(later);
  });

  it("claims at most batch ids per poll", async function () {
    const calls = [];
    const alarms = this.make(async (id) => calls.push(id), { batch: 2 });

    for (const id of ["a", "b", "c", "d", "e"]) await alarms.set(id, this.t);

    expect(await alarms.poll()).toEqual(2);
    expect(await alarms.poll()).toEqual(2);
    expect(await alarms.poll()).toEqual(1);
    expect(await alarms.poll()).toEqual(0);
    expect(calls.slice().sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("does not run overlapping polls in one instance", async function () {
    const calls = [];
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    const alarms = this.make(async (id) => {
      calls.push(id);
      await gate;
    });

    await alarms.set("a", this.t);
    const first = alarms.poll();
    const second = alarms.poll();
    expect(second).toBe(first);

    release();
    expect(await Promise.all([first, second])).toEqual([1, 1]);
    expect(calls).toEqual(["a"]);
  });

  it("start polls on a timer and stop ends it", async function () {
    const calls = [];
    const alarms = this.make(async (id) => calls.push(id), { pollMs: 10 });

    await alarms.set("a", this.t);
    alarms.start();
    alarms.start();
    for (let i = 0; i < 100 && !calls.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(calls).toEqual(["a"]);

    await alarms.stop();
    await alarms.set("b", this.t);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(calls).toEqual(["a"]);
    expect(await alarms.when("b")).toEqual(this.t);
  });
});
