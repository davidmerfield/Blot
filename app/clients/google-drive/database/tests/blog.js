describe("google drive database.blog", function () {
  const database = require("clients/google-drive/database");
  const client = require("models/client");
  const prefix = require("clients/google-drive/database/prefix");

  afterEach(async function () {
    const keys = await new Promise((resolve, reject) => {
      client.keys(`${prefix}*`, (err, keys) => {
        if (err) reject(err);
        else resolve(keys);
      });
    });
  
    if (keys.length) {
      await new Promise((resolve, reject) => {
        client.del(keys, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  it("can store and retrieve account information", async function () {
    const blogID = "blog_" + Date.now().toString();
    await database.blog.store(blogID, { foo: "bar" });
    const account = await database.blog.get(blogID);
    expect(account).toEqual({ foo: "bar" });
    await database.blog.store(blogID, { baz: "bat" });
    const updatedAccount = await database.blog.get(blogID);
    expect(updatedAccount).toEqual({ foo: "bar", baz: "bat" });
  });

  it("can list all blog IDs", async function () {
    const blogID1 = "blog_" + Date.now().toString();
    const blogID2 = "blog_" + (Date.now() + 1).toString();
  
    await database.blog.store(blogID1, { foo: "bar" });
    await database.blog.store(blogID2, { baz: "bat" });
  
    const blogIDs = await database.blog.list();
  
    // Sort both arrays before comparing
    expect(blogIDs.sort()).toEqual([blogID1, blogID2].sort());
  });

  it("can delete a blog and clean up related data", async function () {
    const blogID = "blog_" + Date.now().toString();

    await database.blog.store(blogID, { foo: "bar" });
    const account = await database.blog.get(blogID);
    expect(account).toEqual({ foo: "bar" });

    await database.blog.delete(blogID);

    // Ensure the blog hash is deleted
    const deletedAccount = await database.blog.get(blogID);
    expect(deletedAccount).toBeNull();

    // Ensure the blog ID is removed from the global set
    const blogIDs = await database.blog.list();
    expect(blogIDs).not.toContain(blogID);
  });

  it("can iterate over all blogs and apply a callback", async function () {
    const blogID1 = "blog_" + Date.now().toString();
    const blogID2 = "blog_" + (Date.now() + 1).toString();

    await database.blog.store(blogID1, { foo: "bar" });
    await database.blog.store(blogID2, { baz: "bat" });

    const result = [];
    await database.blog.iterate((blogID, blogData) => {
      result.push({ blogID, blogData });
    });

    result.sort((a, b) => a.blogID.localeCompare(b.blogID));
    const expected = [
      { blogID: blogID1, blogData: { foo: "bar" } },
      { blogID: blogID2, blogData: { baz: "bat" } },
    ];
    expected.sort((a, b) => a.blogID.localeCompare(b.blogID));
    expect(result).toEqual(expected);
  });
  it("returns null for a non-existent blog", async function () {
    const nonExistentblogID = "blog_non_existent";

    const account = await database.blog.get(nonExistentblogID);
    expect(account).toBeNull();
  });

  it("can update blog fields without overwriting existing ones", async function () {
    const blogID = "blog_" + Date.now().toString();
  
    // Initial store
    await database.blog.store(blogID, { foo: "bar" });
    const initialAccount = await database.blog.get(blogID);
    expect(initialAccount).toEqual({ foo: "bar" });
  
    // Ensure no unexpected fields exist
    expect(initialAccount.baz).toBeUndefined();
  
    // Update with new field
    await database.blog.store(blogID, { baz: "bat" });
    const updatedAccount = await database.blog.get(blogID);
    expect(updatedAccount).toEqual({ foo: "bar", baz: "bat" });
  
    // Ensure no unexpected fields exist
    expect(updatedAccount.qux).toBeUndefined();
  
    // Update an existing field
    await database.blog.store(blogID, { foo: "updated" });
    const finalAccount = await database.blog.get(blogID);
    expect(finalAccount).toEqual({ foo: "updated", baz: "bat" });
  
    // Ensure no unexpected fields exist
    expect(finalAccount.qux).toBeUndefined();
  });

  it("can store and list multiple blogs independently", async function () {
    const blogID1 = "blog_" + Date.now().toString();
    const blogID2 = "blog_" + (Date.now() + 1).toString();

    await database.blog.store(blogID1, { foo: "bar" });
    await database.blog.store(blogID2, { baz: "bat" });

    const blogIDs = await database.blog.list();
    expect(blogIDs.sort()).toEqual([blogID1, blogID2].sort());

    const account1 = await database.blog.get(blogID1);
    const account2 = await database.blog.get(blogID2);

    expect(account1).toEqual({ foo: "bar" });
    expect(account2).toEqual({ baz: "bat" });
  });

  it("can delete a non-existent blog without errors", async function () {
    const nonExistentblogID = "blog_non_existent";

    // Attempt to delete a blog that doesn't exist
    await database.blog.delete(nonExistentblogID);

    // Ensure no blog ID exists in the global set
    const blogIDs = await database.blog.list();
    expect(blogIDs).not.toContain(nonExistentblogID);
  });

  it("does not overwrite fields when updating with an empty object", async function () {
    const blogID = "blog_" + Date.now().toString();
    await database.blog.store(blogID, { foo: "bar", baz: "bat" });
  
    // Update with an empty object
    await database.blog.store(blogID, {});
  
    // Ensure fields remain unchanged
    const account = await database.blog.get(blogID);
    expect(account).toEqual({ foo: "bar", baz: "bat" });
  });

  it("maintains global set integrity across multiple operations", async function () {
    const blogID1 = "blog_" + Date.now().toString();
    const blogID2 = "blog_" + (Date.now() + 1).toString();
  
    await database.blog.store(blogID1, { foo: "bar" });
    await database.blog.store(blogID2, { baz: "bat" });
  
    // Initial check
    let blogIDs = await database.blog.list();
    expect(blogIDs.sort()).toEqual([blogID1, blogID2].sort());
  
    // Delete one blog
    await database.blog.delete(blogID1);
  
    // Ensure the global set is updated
    blogIDs = await database.blog.list();
    expect(blogIDs).toEqual([blogID2]);
  
    // Add the blog back
    await database.blog.store(blogID1, { foo: "bar" });
  
    // Ensure both blog IDs are back
    blogIDs = await database.blog.list();
    expect(blogIDs.sort()).toEqual([blogID1, blogID2].sort());
  });

  it("throws an error when storing with invalid input", async function () {
    const blogID = "blog_" + Date.now().toString();
  
    // Attempt to store invalid inputs
    await expectAsync(database.blog.store(blogID, null)).toBeRejected();
    await expectAsync(database.blog.store(blogID, undefined)).toBeRejected();
    await expectAsync(database.blog.store(blogID, "")).toBeRejected();
  });

  it("returns an empty list if no blogs are stored", async function () {
    const blogIDs = await database.blog.list();
    expect(blogIDs).toEqual([]);
  });

  it("handles concurrent operations correctly", async function () {
    const blogID1 = "blog_" + Date.now().toString();
    const blogID2 = "blog_" + (Date.now() + 1).toString();
  
    // Perform concurrent store operations
    await Promise.all([
      database.blog.store(blogID1, { foo: "bar" }),
      database.blog.store(blogID2, { baz: "bat" }),
    ]);
  
    // Ensure both blogs are stored
    const blogIDs = await database.blog.list();
    expect(blogIDs.sort()).toEqual([blogID1, blogID2].sort());
  });

  it("can handle storing a blog with a large number of fields", async function () {
    const blogID = "blog_large_" + Date.now().toString();
  
    const largeData = {};
    for (let i = 0; i < 1000; i++) {
      largeData[`field_${i}`] = `value_${i}`;
    }
  
    await database.blog.store(blogID, largeData);
  
    const account = await database.blog.get(blogID);
    expect(Object.keys(account).length).toBe(1000);
    for (let i = 0; i < 1000; i++) {
      expect(account[`field_${i}`]).toBe(`value_${i}`);
    }
  });
});
