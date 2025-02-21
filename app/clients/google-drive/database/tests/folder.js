describe("folder module", function () {
  const folderModule = require("clients/google-drive/database/folder");
  const client = require("models/client");
  const prefix = require("clients/google-drive/database/prefix");

  let folder;

  beforeEach(function () {
    const folderId = "test_folder";
    folder = folderModule(folderId); // Create a new folder instance for each test
  });

  // Clear Redis data after each test
  afterEach(function (done) {
    client.keys(`${prefix}*`, async function (err, keys) {
      if (err) return done(err);
      if (!keys.length) return done();
      client.del(keys, done);
    });
  });

  it("can set and get a mapping (ID → Path)", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";

    await folder.set(id, path);
    const retrievedPath = await folder.get(id);
    expect(retrievedPath).toBe(path);
  });

  it("can set and get a mapping (Path → ID)", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";

    await folder.set(id, path);
    const retrievedId = await folder.getByPath(path);
    expect(retrievedId).toBe(id);
  });

  it("can set and get metadata for a file", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";
    const metadata = { size: 1024, lastModified: "2025-02-21" };

    await folder.set(id, path, metadata);
    const retrievedMetadata = await folder.getMetadata(id);
    expect(retrievedMetadata).toEqual(metadata);
  });

  it("can move a file to a new path", async function () {
    const id = "file_1";
    const oldPath = "/folder/old/file1.txt";
    const newPath = "/folder/new/file1.txt";
  
    await folder.set(id, oldPath);
    const movedPaths = await folder.move(id, newPath);
  
    // Ensure the correct move is recorded
    expect(movedPaths).toEqual([{ from: oldPath, to: newPath }]);
  
    // Ensure the file's path is updated
    const updatedPath = await folder.get(id);
    expect(updatedPath).toBe(newPath);
  });


  it("can move a folder and all its children", async function () {
    const folderId = "folder_1";
    const fileId1 = "file_1";
    const fileId2 = "file_2";
    const oldFolderPath = "/folder/old";
    const newFolderPath = "/folder/new";

    await folder.set(folderId, oldFolderPath);
    await folder.set(fileId1, `${oldFolderPath}/file1.txt`);
    await folder.set(fileId2, `${oldFolderPath}/file2.txt`);

    const movedPaths = await folder.move(folderId, newFolderPath);

    expect(movedPaths).toEqual([
      { from: oldFolderPath, to: newFolderPath },
      { from: `${oldFolderPath}/file1.txt`, to: `${newFolderPath}/file1.txt` },
      { from: `${oldFolderPath}/file2.txt`, to: `${newFolderPath}/file2.txt` },
    ]);

    const updatedFolderPath = await folder.get(folderId);
    const updatedFilePath1 = await folder.get(fileId1);
    const updatedFilePath2 = await folder.get(fileId2);

    expect(updatedFolderPath).toBe(newFolderPath);
    expect(updatedFilePath1).toBe(`${newFolderPath}/file1.txt`);
    expect(updatedFilePath2).toBe(`${newFolderPath}/file2.txt`);
  });

  it("throws an error when moving to or from root", async function () {
    const id = "file_1";
    const path = "/file1.txt";

    await folder.set(id, path);

    // Test moving to root
    try {
      await folder.move(id, "/");
      fail("Expected an error when moving to root");
    } catch (err) {
      expect(err.message).toBe("Cannot move to or from root");
    }

    // Test moving from root
    try {
      await folder.move("/", path);
      fail("Expected an error when moving from root");
    } catch (err) {
      expect(err.message).toBe("Cannot move to or from root");
    }
  });

  it("can remove a file", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";

    await folder.set(id, path);
    const removedPaths = await folder.remove(id);

    expect(removedPaths).toEqual([path]);

    const retrievedPath = await folder.get(id);
    expect(retrievedPath).toBeNull();

    const retrievedId = await folder.getByPath(path);
    expect(retrievedId).toBeNull();
  });

  it("can remove a folder and all its children", async function () {
    const folderId = "folder_1";
    const fileId1 = "file_1";
    const fileId2 = "file_2";
    const folderPath = "/folder";
    const filePath1 = `${folderPath}/file1.txt`;
    const filePath2 = `${folderPath}/file2.txt`;

    await folder.set(folderId, folderPath);
    await folder.set(fileId1, filePath1);
    await folder.set(fileId2, filePath2);

    const removedPaths = await folder.remove(folderId);

    expect(removedPaths.sort()).toEqual(
      [folderPath, filePath1, filePath2].sort()
    );

    const retrievedFolderPath = await folder.get(folderId);
    const retrievedFilePath1 = await folder.get(fileId1);
    const retrievedFilePath2 = await folder.get(fileId2);

    expect(retrievedFolderPath).toBeNull();
    expect(retrievedFilePath1).toBeNull();
    expect(retrievedFilePath2).toBeNull();
  });

  it("can reset all mappings and metadata", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";
    const metadata = { size: 1024, lastModified: "2025-02-21" };

    await folder.set(id, path, metadata);
    await folder.reset();

    const retrievedPath = await folder.get(id);
    const retrievedMetadata = await folder.getMetadata(id);

    expect(retrievedPath).toBeNull();
    expect(retrievedMetadata).toBeNull();
  });

  it("can set and get the page token", async function () {
    const token = "page_token_123";

    await folder.setPageToken(token);
    const retrievedToken = await folder.getPageToken();

    expect(retrievedToken).toBe(token);
  });

  it("can list all files and folders with metadata", async function () {
    const id1 = "file_1";
    const id2 = "file_2";
    const path1 = "/folder/file1.txt";
    const path2 = "/folder/file2.txt";
    const metadata1 = { size: 1024, lastModified: "2025-02-21" };
    const metadata2 = { size: 2048, lastModified: "2025-02-22" };

    await folder.set(id1, path1, metadata1);
    await folder.set(id2, path2, metadata2);

    const results = await folder.listAll();

    expect(results).toEqual(
      jasmine.arrayWithExactContents([
        { id: id1, path: path1, metadata: metadata1 },
        { id: id2, path: path2, metadata: metadata2 },
      ])
    );
  });

  it("move won't clobber a similar file", async function () {
    const id1 = "file_1";
    const id2 = "folder_1";
    const id3 = "file_2";
  
    await folder.set(id1, "/bar (1).txt");
    await folder.set(id2, "/bar");
    await folder.set(id3, "/bar/foo.txt");
  
    await folder.move(id2, "/foo");
  
    expect(await folder.get(id1)).toBe("/bar (1).txt"); // Unaffected
    expect(await folder.get(id2)).toBe("/foo"); // Moved
    expect(await folder.get(id3)).toBe("/foo/foo.txt"); // Child moved with the folder
  });

  it("remove won't clobber a similar file", async function () {
    const id1 = "file_1";
    const id2 = "folder_1";
    const id3 = "file_2";
  
    await folder.set(id1, "/bar (1).txt");
    await folder.set(id2, "/bar");
    await folder.set(id3, "/bar/foo.txt");
  
    const removedPaths = await folder.remove(id2);
  
    expect(removedPaths).toEqual(["/bar", "/bar/foo.txt"]); // Only these paths are removed
    expect(await folder.get(id1)).toBe("/bar (1).txt"); // Unaffected
    expect(await folder.get(id2)).toBeNull(); // Removed
    expect(await folder.get(id3)).toBeNull(); // Removed
  });

  it("move returns a list of affected paths for a single file", async function () {
    const id = "file_1";
    const oldPath = "/bar.txt";
    const newPath = "/baz.txt";
  
    await folder.set(id, oldPath);
    const movedPaths = await folder.move(id, newPath);
  
    expect(movedPaths).toEqual([{ from: oldPath, to: newPath }]); // Correctly lists the affected paths
  });

  it("move returns a list of affected paths for a folder", async function () {
    const folderId = "folder_1";
    const fileId = "file_1";
    const oldFolderPath = "/foo";
    const newFolderPath = "/bar";
  
    await folder.set(folderId, oldFolderPath);
    await folder.set(fileId, `${oldFolderPath}/file1.txt`);
  
    const movedPaths = await folder.move(folderId, newFolderPath);
  
    expect(movedPaths.sort()).toEqual([
      { from: oldFolderPath, to: newFolderPath },
      { from: `${oldFolderPath}/file1.txt`, to: `${newFolderPath}/file1.txt` },
    ]);
  });

  it("remove removes all children for root", async function () {
    const rootId = "root";
    const fileId1 = "file_1";
    const fileId2 = "file_2";
  
    await folder.set(rootId, "/");
    await folder.set(fileId1, "/foo.txt");
    await folder.set(fileId2, "/bar/foo.txt");
  
    const removedPaths = await folder.remove(rootId);
  
    expect(removedPaths.sort()).toEqual(["/", "/foo.txt", "/bar/foo.txt"].sort());
    expect(await folder.get(rootId)).toBeNull();
    expect(await folder.get(fileId1)).toBeNull();
    expect(await folder.get(fileId2)).toBeNull();
  });

  it("can lookup an ID by path", async function () {
    const id1 = "file_1";
    const id2 = "file_2";
  
    await folder.set(id1, "/bar (1).txt");
    await folder.set(id2, "/bar/foo.txt");
  
    expect(await folder.getByPath("/bar (1).txt")).toBe(id1);
    expect(await folder.getByPath("/bar/foo.txt")).toBe(id2);
    expect(await folder.getByPath("/bar")).toBeNull(); // Nonexistent path
  });

  it("can reset all mappings and metadata", async function () {
    const id = "file_1";
    const path = "/folder/file1.txt";
    const metadata = { size: 1024, lastModified: "2025-02-21" };
  
    await folder.set(id, path, metadata);
    await folder.reset();
  
    // Ensure all mappings, metadata, and keys are removed
    const retrievedPath = await folder.get(id);
    const retrievedMetadata = await folder.getMetadata(id);
    const allFiles = await folder.listAll();
  
    expect(retrievedPath).toBeNull();
    expect(retrievedMetadata).toBeNull();
    expect(allFiles).toEqual([]);
  });

  it("move handles folder children, including nested folders", async function () {
    const folderId = "folder_1";
    const nestedFolderId = "nested_folder";
    const fileId = "file_1";
  
    await folder.set(folderId, "/foo");
    await folder.set(nestedFolderId, "/foo/bar");
    await folder.set(fileId, "/foo/bar/file1.txt");
  
    await folder.move(folderId, "/baz");
  
    expect(await folder.get(folderId)).toBe("/baz");
    expect(await folder.get(nestedFolderId)).toBe("/baz/bar");
    expect(await folder.get(fileId)).toBe("/baz/bar/file1.txt");
  });
});
