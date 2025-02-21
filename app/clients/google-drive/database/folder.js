const { promisify } = require("util");

// Redis client setup
const client = require("models/client");
const hsetAsync = promisify(client.hset).bind(client);
const hgetAsync = promisify(client.hget).bind(client);
const hdelAsync = promisify(client.hdel).bind(client);
const hscanAsync = promisify(client.hscan).bind(client);
const delAsync = promisify(client.del).bind(client);
const setAsync = promisify(client.set).bind(client);
const getAsync = promisify(client.get).bind(client);

const PREFIX = require("./prefix");

function folder(folderId) {
  // Redis keys
  this.key = `${PREFIX}${folderId}:folder`; // ID ↔ Path mapping
  this.reverseKey = `${PREFIX}${folderId}:path`; // Path ↔ ID mapping
  this.metadataKey = `${PREFIX}${folderId}:metadata`; // File metadata
  this.tokenKey = `${PREFIX}${folderId}:pageToken`; // Sync page token

  // Set a mapping (ID → Path) and store metadata
  this.set = async (id, path, metadata = {}) => {
    // Update ID ↔ Path mapping
    await hsetAsync(this.key, id, path);
    await hsetAsync(this.reverseKey, path, id);

    // Update metadata (if provided)
    if (metadata && Object.keys(metadata).length > 0) {
      await hsetAsync(
        this.metadataKey,
        id,
        JSON.stringify(metadata) // Store metadata as a JSON string
      );
    }
  };

  // Get the path for a given ID
  this.get = async (id) => {
    if (!id) return null;
    return await hgetAsync(this.key, id);
  };

  // Get the ID for a given path
  this.getByPath = async (path) => {
    if (!path) return null;
    return await hgetAsync(this.reverseKey, path);
  };

  // Get metadata for a given ID
  this.getMetadata = async (id) => {
    const metadata = await hgetAsync(this.metadataKey, id);
    return metadata ? JSON.parse(metadata) : null;
  };

  this.move = async (id, to) => {
    if (id === "/" || to === "/") {
      throw new Error("Cannot move to or from root");
    }
  
    const from = await this.get(id);
    if (!from) throw new Error(`No file or folder found for ID: ${id}`);
  
    let movedPaths = [];
  
    // If `from` is the exact path of the file, treat it as a file move
    if (from === to || !from.startsWith("/")) {
      const metadata = (await this.getMetadata(id)) || {}; // Default to empty metadata
      await this.set(id, to, metadata);
      movedPaths.push({ from, to });
      return movedPaths;
    }
  
    // For folders, update all child paths
    const START_CURSOR = "0";
    let cursor = START_CURSOR;
  
    do {
      const [nextCursor, results] = await hscanAsync(this.key, cursor);
      cursor = nextCursor;
  
      const changes = [];
      for (let i = 0; i < results.length; i += 2) {
        const currentId = results[i];
        const currentPath = results[i + 1];
  
        // Check if the current path is affected by the move
        if (currentPath === from || currentPath.startsWith(`${from}/`)) {
          const newPath = to + currentPath.slice(from.length);
          const metadata = (await this.getMetadata(currentId)) || {}; // Default to empty metadata
          changes.push({ id: currentId, path: newPath, metadata });
          movedPaths.push({ from: currentPath, to: newPath });
        }
      }
  
      // Apply the changes
      for (const { id, path, metadata } of changes) {
        await this.set(id, path, metadata);
      }
    } while (cursor !== START_CURSOR);
  
    return movedPaths;
  };
      
  // Remove a file or folder and its children
  this.remove = async (id) => {
    const from = await this.get(id);
    if (!from) return [];

    let removedPaths = [];

    // Scan and delete all affected paths
    const START_CURSOR = "0";
    let cursor = START_CURSOR;

    do {
      const [nextCursor, results] = await hscanAsync(this.key, cursor);
      cursor = nextCursor;

      const idsToDelete = [];
      for (let i = 0; i < results.length; i += 2) {
        const currentId = results[i];
        const currentPath = results[i + 1];

        // Check if the current path is affected by the removal
        if (from === "/" || currentPath === from || currentPath.startsWith(`${from}/`)) {
          idsToDelete.push(currentId);
          removedPaths.push(currentPath);

          // Delete reverse mapping and metadata
          await hdelAsync(this.reverseKey, currentPath);
          await hdelAsync(this.metadataKey, currentId);
        }
      }

      // Delete IDs from the main mapping
      if (idsToDelete.length > 0) {
        await hdelAsync(this.key, idsToDelete);
      }
    } while (cursor !== START_CURSOR);

    return removedPaths;
  };

  // Reset all mappings and metadata
  this.reset = async () => {
    await delAsync(this.key);
    await delAsync(this.reverseKey);
    await delAsync(this.metadataKey);
    await delAsync(this.tokenKey);
  };

  // Set or get the page token for syncing
  this.setPageToken = async (token) => {
    await setAsync(this.tokenKey, token);
  };

  this.getPageToken = async () => {
    return await getAsync(this.tokenKey);
  };

  // List all files and folders with metadata
  this.listAll = async () => {
    const START_CURSOR = "0";
    let cursor = START_CURSOR;
    let results = [];

    do {
      const [nextCursor, entries] = await hscanAsync(this.key, cursor);
      cursor = nextCursor;

      for (let i = 0; i < entries.length; i += 2) {
        const id = entries[i];
        const path = entries[i + 1];
        const metadata = await this.getMetadata(id);
        results.push({ id, path, metadata });
      }
    } while (cursor !== START_CURSOR);

    return results;
  };

  return this;
}

module.exports = folder;
