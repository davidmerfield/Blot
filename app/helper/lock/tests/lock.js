describe("helper/lock lock", function () {
  const lock = require("helper/lock");
  const client = require("models/client");
  const { randomUUID } = require("crypto");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const prefix = "test:helper-lock:lock:" + randomUUID() + ":";
  let n = 0;
  const keys = [];
  const newKey = () => {
    const key = prefix + n++;
    keys.push(key);
    return key;
  };

  afterAll(async function () {
    if (keys.length) await client.del(keys);
  });

  it("is exclusive while held and rejects with ELOCKED", async function () {
    const key = newKey();
    const first = await lock(key);
    let error;
    try {
      await lock(key);
    } catch (e) {
      error = e;
    }
    expect(error && error.code).toEqual("ELOCKED");
    await first.release();
    const second = await lock(key);
    await second.release();
  });

  it("succeeds on retry once the holder releases", async function () {
    const key = newKey();
    const first = await lock(key);
    setTimeout(() => first.release(), 100);
    const second = await lock(key, { retries: 3, minTimeout: 100 });
    expect(second.token).toEqual(jasmine.any(String));
    await second.release();
  });

  it("gives up with ELOCKED when retries are exhausted", async function () {
    const key = newKey();
    const first = await lock(key);
    let error;
    try {
      await lock(key, { retries: 1, minTimeout: 20 });
    } catch (e) {
      error = e;
    }
    expect(error && error.code).toEqual("ELOCKED");
    await first.release();
  });

  it("is safe to release twice", async function () {
    const key = newKey();
    const held = await lock(key);
    await held.release();
    await held.release();
    expect(await client.get(key)).toBeNull();
  });

  it("does not delete another holder's lock when released after expiry", async function () {
    const key = newKey();
    const first = await lock(key, { ttl: 100, heartbeat: 10000 });
    await sleep(200);
    const second = await lock(key);
    let error;
    try {
      await first.release();
    } catch (e) {
      error = e;
    }
    expect(error && error.code).toEqual("ECOMPROMISED");
    expect(await client.get(key)).toEqual(second.token);
    await second.release();
  });

  it("keeps the lock alive past its ttl with the heartbeat", async function () {
    const key = newKey();
    const held = await lock(key, { ttl: 300, heartbeat: 50 });
    await sleep(900);
    expect(await client.get(key)).toEqual(held.token);
    let error;
    try {
      await lock(key);
    } catch (e) {
      error = e;
    }
    expect(error && error.code).toEqual("ELOCKED");
    await held.release();
  });

  it("calls onCompromised once if the key is deleted underneath", async function () {
    const key = newKey();
    const compromised = [];
    const held = await lock(key, {
      ttl: 1000,
      heartbeat: 30,
      onCompromised: (e) => compromised.push(e),
    });
    await client.del(key);
    await sleep(250);
    expect(compromised.length).toEqual(1);
    expect(compromised[0].code).toEqual("ECOMPROMISED");
    await held.release().catch(() => {});
    expect(compromised.length).toEqual(1);
  });

  it("calls onCompromised if the key is changed underneath", async function () {
    const key = newKey();
    const compromised = [];
    const held = await lock(key, {
      ttl: 1000,
      heartbeat: 30,
      onCompromised: (e) => compromised.push(e),
    });
    await client.set(key, "someone-else");
    await sleep(250);
    expect(compromised.length).toEqual(1);
    expect(await client.get(key)).toEqual("someone-else");
    await held.release().catch(() => {});
  });

  it("reports inspect and heldSince", async function () {
    const key = newKey();
    expect((await lock.inspect(key)).held).toEqual(false);
    expect(await lock.heldSince(key)).toBeNull();
    const before = Date.now();
    const held = await lock(key, { ttl: 5000 });
    const info = await lock.inspect(key);
    expect(info.held).toEqual(true);
    expect(info.holder).toEqual(held.token);
    expect(info.ttlMs).toBeGreaterThan(0);
    const since = await lock.heldSince(key);
    expect(since).not.toBeLessThan(before);
    expect(since).not.toBeGreaterThan(Date.now());
    await held.release();
  });
});
