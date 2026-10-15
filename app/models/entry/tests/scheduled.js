describe("entry scheduled publication", function () {
  require("./setup")();

  global.test.timeout(30 * 1000);

  const client = require("models/client");
  const scheduled = require("../scheduled");
  const alarms = scheduled.alarm;

  const DUE = "alarm:due:scheduled-entries";
  const CLAIMS = "alarm:claims:scheduled-entries";
  const DAY = 24 * 60 * 60 * 1000;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(function () {
    this.ids = [];
    this.id = (path) => {
      const id = scheduled.toID(this.blog.id, path);
      this.ids.push(id);
      return id;
    };
    this.future = (ms) => new Date(Date.now() + ms).toISOString();
  });

  // Only this spec's ids: other specs may share the alarm keys
  afterEach(async function () {
    for (const id of this.ids) {
      await client.zRem(DUE, id);
      await client.hDel(CLAIMS, id);
    }
  });

  it("sets the alarm at the dateStamp of a scheduled entry", async function () {
    const id = this.id("/future.txt");
    const entry = await this.set(
      "/future.txt",
      "Date: " + this.future(DAY) + "\n\nHello"
    );

    expect(entry.scheduled).toBe(true);
    expect(await alarms.when(id)).toEqual(entry.dateStamp);
  });

  it("cancels the alarm when the date moves to the past", async function () {
    const id = this.id("/future.txt");
    await this.set("/future.txt", "Date: " + this.future(DAY) + "\n\nHello");
    expect(await alarms.when(id)).not.toBe(null);

    const entry = await this.set("/future.txt", "Date: 2020-01-01\n\nHello");

    expect(entry.scheduled).toBe(false);
    expect(await alarms.when(id)).toBe(null);
  });

  it("cancels the alarm when the entry becomes a draft", async function () {
    const id = this.id("/future.txt");
    await this.set("/future.txt", "Date: " + this.future(DAY) + "\n\nHello");
    expect(await alarms.when(id)).not.toBe(null);

    const set = require("../set");
    await new Promise((resolve, reject) =>
      set(this.blog.id, "/future.txt", { draft: true }, (err) =>
        err ? reject(err) : resolve()
      )
    );

    expect(await alarms.when(id)).toBe(null);
  });

  it("cancels the alarm when the entry is dropped", async function () {
    const id = this.id("/future.txt");
    await this.set("/future.txt", "Date: " + this.future(DAY) + "\n\nHello");
    expect(await alarms.when(id)).not.toBe(null);

    await this.drop("/future.txt");

    expect(await alarms.when(id)).toBe(null);
  });

  it("round-trips an id whose path contains colons", async function () {
    const id = this.id("/a:b/c:d.txt");

    expect(scheduled.fromID(id)).toEqual({
      blogID: this.blog.id,
      path: "/a:b/c:d.txt",
    });
  });

  it("publishes a due entry when the alarm is polled", async function () {
    const id = this.id("/soon.txt");
    await this.set("/soon.txt", "Date: " + this.future(1500) + "\n\nHello");
    expect((await this.get("/soon.txt")).scheduled).toBe(true);

    await sleep(2000);
    await alarms.poll();

    const entry = await this.get("/soon.txt");
    expect(entry.scheduled).toBe(false);
    expect(await alarms.when(id)).toBe(null);
  });

  it("re-arms the alarm for the new date if the entry was rescheduled", async function () {
    const id = this.id("/later.txt");
    const entry = await this.set(
      "/later.txt",
      "Date: " + this.future(DAY) + "\n\nHello"
    );

    // A stale alarm that fires early
    await alarms.set(id, Date.now() - 1000);
    await alarms.poll();

    expect((await this.get("/later.txt")).scheduled).toBe(true);
    expect(await alarms.when(id)).toEqual(entry.dateStamp);
  });

  it("ignores an alarm for an entry that no longer exists", async function () {
    const id = this.id("/missing.txt");

    await alarms.set(id, Date.now() - 1000);
    await alarms.poll();

    expect(await alarms.when(id)).toBe(null);
  });
});
