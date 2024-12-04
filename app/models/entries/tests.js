const redis = require("models/client");
const Entries = require("./index"); // Replace with the correct path to the Entries module
const Entry = require("../entry");
const Blog = require("../blog");

describe("entries", function () {
  // Cleans up the Redis database after each test
  // and exposes a test blog to each test
  global.test.blog();

  it("getTotal should return the total number of entries for a blog", async function (done) {
    const key = `blog:${this.blog.id}:entries`;

    // Add mock entries in Redis
    await redis.zadd(key, 1, "entry1", 2, "entry2", 3, "entry3");

    Entries.getTotal(this.blog.id, function (err, total) {
      expect(err).toBeNull();
      expect(total).toBe(3);
      done();
    });
  });

  it("getTotal should return 0 if no entries exist for a blog", function (done) {
    Entries.getTotal(this.blog.id, function (err, total) {
      expect(err).toBeNull();
      expect(total).toBe(0);
      done();
    });
  });

  it("getAllIDs should return all entry IDs for a blog", async function (done) {
    const key = `blog:${this.blog.id}:all`;

    // Add mock entries in Redis
    await redis.zadd(key, 1, "id1", 2, "id2", 3, "id3");

    Entries.getAllIDs(this.blog.id, function (err, ids) {
      expect(err).toBeNull();
      expect(ids).toEqual(["id3", "id2", "id1"]); // Returned in descending order
      done();
    });
  });

  it("getAllIDs should return an empty array if no entries exist", function (done) {
    Entries.getAllIDs(this.blog.id, function (err, ids) {
      expect(err).toBeNull();
      expect(ids).toEqual([]);
      done();
    });
  });

  it("getRecent should return the most recent entries with their indices", async function (done) {
    const key = `blog:${this.blog.id}:entries`;

    // Add mock entries in Redis
    await redis.zadd(key, 1, "id1", 2, "id2", 3, "id3");

    // Mock entries returned by Entry.get
    spyOn(Entry, "get").and.callFake((blogID, ids, callback) => {
      const entries = ids.map((id, index) => ({
        id,
        dateStamp: Date.now() - index * 1000,
      }));
      callback(entries);
    });

    Entries.getRecent(this.blog.id, function (entries) {
      expect(entries.map((entry) => entry.id)).toEqual(["id3", "id2", "id1"]);
      expect(entries[0].index).toBe(3);
      expect(entries[1].index).toBe(2);
      expect(entries[2].index).toBe(1);
      done();
    });
  });

  it("getRecent should return an empty array if there are no entries", function (done) {
    Entries.getRecent(this.blog.id, function (entries) {
      expect(entries).toEqual([]);
      done();
    });
  });

  describe("adjacentTo", function () {
    beforeEach(function () {
      spyOn(Entry, "get").and.callFake((blogID, ids, callback) => {
        const entries = ids.map((id) => ({ id }));
        callback(entries);
      });
    });

    it("should return adjacent entries correctly", async function (done) {
      const key = `blog:${this.blog.id}:entries`;

      // Add mock entries in Redis
      await redis.zadd(key, 1, "id1", 2, "id2", 3, "id3");

      Entries.adjacentTo(this.blog.id, "id2", function (next, previous, rank) {
        expect(previous).toEqual({ id: "id1" });
        expect(next).toEqual({ id: "id3" });
        expect(rank).toBe(2);
        done();
      });
    });

    it("should return undefined if the entry is at the start of the list", async function (done) {
      const key = `blog:${this.blog.id}:entries`;

      // Add mock entries in Redis
      await redis.zadd(key, 1, "id1", 2, "id2", 3, "id3");

      Entries.adjacentTo(this.blog.id, "id1", function (next, previous, rank) {
        expect(previous).toBeUndefined();
        expect(next).toEqual({ id: "id2" });
        expect(rank).toBe(1);
        done();
      });
    });

    it("should return undefined if the entry is at the end of the list", async function (done) {
      const key = `blog:${this.blog.id}:entries`;

      // Add mock entries in Redis
      await redis.zadd(key, 1, "id1", 2, "id2", 3, "id3");

      Entries.adjacentTo(this.blog.id, "id3", function (next, previous, rank) {
        expect(previous).toEqual({ id: "id2" });
        expect(next).toBeUndefined();
        expect(rank).toBe(3);
        done();
      });
    });
  });

  describe("resave", function () {
    it("should update entries with new dateStamps", async function (done) {
      const blog = { id: this.blog.id, permalink: true };
      const entries = [
        { path: "entry1", metadata: {}, id: "id1", metadata: {} },
        { path: "entry2", metadata: {}, id: "id2", metadata: {} },
      ];

      // Mock Blog.get
      spyOn(Blog, "get").and.callFake((query, callback) => {
        console.log("FAKE BLOG GET");
        callback(null, blog);
      });

      // Add mock entries in Redis
      const key = `blog:${this.blog.id}:all`;
      await redis.zadd(key, 1, "id1", 2, "id2");

      // Mock Entry.get to return the entries
      spyOn(Entry, "get").and.callFake((blogID, id, callback) => {
        console.log("FAKE ENTRY GET");
        const result = entries.find((entry) => entry.id === id);
        callback(result);
      });

      // Mock Entry.set
      spyOn(Entry, "set").and.callFake((blogID, path, changes, callback) => {
        console.log("FAKE ENTRY SET");
        expect(changes).toEqual(jasmine.any(Object));
        callback();
      });

      Entries.resave(this.blog.id, function (err) {
        expect(err).toBeNull();
        expect(Entry.set).toHaveBeenCalledTimes(2); // Once per entry
        done();
      });
    });

    it("should handle errors when fetching the blog", function (done) {
      // Mock Blog.get
      spyOn(Blog, "get").and.callFake((query, callback) => {
        callback(new Error("Blog not found"));
      });

      Entries.resave(this.blog.id, function (err) {
        expect(err).toEqual(jasmine.any(Error));
        expect(err.message).toBe("Blog not found");
        done();
      });
    });
  });
});
