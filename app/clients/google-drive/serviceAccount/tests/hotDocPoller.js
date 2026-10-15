// The hot doc poller keeps its state in Redis and its poll schedule in a
// helper/alarm queue, so any process can poll a doc another one enqueued.
// These specs use the real Redis: enqueue, make the alarm due, let the poll
// claim it, and check what it re-armed.
describe("google drive hotDocPoller", function () {
  const { randomUUID } = require("crypto");
  const client = require("models/client");
  const poller = require("../hotDocPoller");

  const ITEM_PREFIX = "blot:google-drive:hotdocs:item:";

  let serviceAccountId, blogID, fileId, folderId, id, revision;

  beforeEach(function () {
    serviceAccountId = "test-sa-" + randomUUID();
    blogID = "blog_" + randomUUID();
    fileId = "file-" + randomUUID();
    folderId = "folder-" + randomUUID();
    id = [serviceAccountId, blogID, fileId].join(":");
    revision = "rev-1";

    spyOn(console, "log");
    spyOn(console, "warn");
    spyOn(poller, "getDocs").and.callFake(async () => ({
      documents: {
        get: async () => ({
          data: { documentId: fileId, title: "Doc", revisionId: revision },
        }),
      },
    }));
    spyOn(poller, "triggerDownloadAndSync").and.resolveTo("synced");
  });

  afterEach(async function () {
    await poller.stop();
    await poller.remove(id, serviceAccountId);
  });

  const makeDue = (when = Date.now() - 1) => poller.alarms.set(id, when);
  const field = (name) => client.hGet(ITEM_PREFIX + id, name);

  it("arms an alarm at the first tier's interval when a doc is enqueued", async function () {
    const before = Date.now();
    await poller.enqueue({ blogID, serviceAccountId, fileId, folderId });

    const due = await poller.alarms.when(id);
    expect(due).toBeGreaterThanOrEqual(before + 2000);
    expect(due).toBeLessThan(Date.now() + 2000 + 300 + 1);
    expect(await field("lastKnownRevision")).toEqual("rev-1");
    expect(await field("folderId")).toEqual(folderId);
  });

  it("polls a due doc and re-arms the alarm for the next poll when nothing changed", async function () {
    await poller.enqueue({ blogID, serviceAccountId, fileId, folderId });
    await makeDue();

    await poller.alarms.poll();

    expect(poller.triggerDownloadAndSync).not.toHaveBeenCalled();
    expect(await field("pollCount")).toEqual("1");
    // Seen a moment ago, so still the 2s tier (plus up to 20% jitter)
    const due = await poller.alarms.when(id);
    expect(due).toBeGreaterThan(Date.now());
    expect(due).toBeLessThanOrEqual(Date.now() + 2000 + 400);
  });

  it("syncs when the revision changed, records it and keeps polling", async function () {
    await poller.enqueue({ blogID, serviceAccountId, fileId, folderId });
    revision = "rev-2";
    await makeDue();

    await poller.alarms.poll();

    expect(poller.triggerDownloadAndSync).toHaveBeenCalledTimes(1);
    expect(poller.triggerDownloadAndSync.calls.argsFor(0)[0].blogID).toEqual(blogID);
    expect(await field("lastKnownRevision")).toEqual("rev-2");
    expect(await poller.alarms.when(id)).toBeGreaterThan(Date.now());
  });

  it("lengthens the interval as the doc ages and stops polling it after ten minutes", async function () {
    await poller.enqueue({ blogID, serviceAccountId, fileId, folderId });

    // 90 seconds since the doc was last seen: the 10s tier
    await client.hSet(ITEM_PREFIX + id, "lastSeen", String(Date.now() - 90 * 1000));
    await makeDue();
    await poller.alarms.poll();
    const due = await poller.alarms.when(id);
    expect(due).toBeGreaterThanOrEqual(Date.now() + 9000);
    expect(due).toBeLessThanOrEqual(Date.now() + 10000 + 2000);

    // Past the last tier: evicted, nothing left to poll
    await client.hSet(ITEM_PREFIX + id, "lastSeen", String(Date.now() - 11 * 60 * 1000));
    await makeDue();
    await poller.alarms.poll();
    expect(await poller.alarms.when(id)).toBeNull();
    expect(await client.exists(ITEM_PREFIX + id)).toEqual(0);
  });

  it("evicts the oldest docs beyond the per service account cap", async function () {
    const ids = [];
    // Enough to pass the per service account cap of 150 without polling
    // (enqueue's own docs.get is the stub above)
    for (let i = 0; i < 152; i++) {
      await poller.enqueue({
        blogID,
        serviceAccountId,
        fileId: fileId + "-" + i,
        folderId,
      });
      ids.push([serviceAccountId, blogID, fileId + "-" + i].join(":"));
    }

    try {
      // Docs enqueued in the same millisecond tie on first seen, so which two
      // went isn't fixed; the cap is what matters.
      const setKey = "blot:google-drive:hotdocs:by-service-account:" + serviceAccountId;
      expect(await client.zCard(setKey)).toEqual(150);
      let remaining = 0;
      for (const each of ids) {
        remaining += await client.exists(ITEM_PREFIX + each);
        if (!(await client.exists(ITEM_PREFIX + each))) {
          expect(await poller.alarms.when(each)).toBeNull();
        }
      }
      expect(remaining).toEqual(150);
    } finally {
      for (const each of ids) await poller.remove(each, serviceAccountId);
    }
  });
});
