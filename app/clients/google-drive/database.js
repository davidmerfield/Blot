const promisify = require("util").promisify;
const client = require("models/client");

// Promisify Redis commands
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const hset = promisify(client.hset).bind(client);
const hget = promisify(client.hget).bind(client);
const hdel = promisify(client.hdel).bind(client);
const hscan = promisify(client.hscan).bind(client);
const sadd = promisify(client.sadd).bind(client);
const srem = promisify(client.srem).bind(client);
const smembers = promisify(client.smembers).bind(client);
const sscan = promisify(client.sscan).bind(client);

// Constants
const PREFIX = "clients:google-drive:";

// Centralized Redis key definitions
const keys = {
  account: (blogID) => `${PREFIX}blog:${blogID}:account`,
  serviceAccount: (serviceAccountId) =>
    `${PREFIX}${serviceAccountId}:service-account`,
  allServiceAccounts: `${PREFIX}all-service-accounts`,
  allChannels: `${PREFIX}all-channels`,
  channelByFileId: (blogID, fileId) => `${PREFIX}blog:${blogID}:file:${fileId}`,
  channel: (channelId) => `${PREFIX}channel:${channelId}`,
};

// Utility: Safely parse JSON
function safeJSONParse(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

const getAccount = async (blogID) => {
  const key = keys.account(blogID);
  const account = safeJSONParse(await get(key));
  return account || null;
};

const setAccount = async (blogID, changes) => {
  const key = keys.account(blogID);

  const existingAccount = (await getAccount(blogID)) || {};
  const updatedAccount = { ...existingAccount, ...changes };

  const multi = client.multi();
  multi.set(key, JSON.stringify(updatedAccount));

  await promisify(multi.exec).bind(multi)();
};

const dropAccount = async (blogID) => {
  const account = await getAccount(blogID);

  const multi = client.multi();
  multi.del(keys.account(blogID));

  if (account && account.folderId) {
    const folderInstance = folder(account.folderId);
    multi.del(folderInstance.key);
    multi.del(folderInstance.tokenKey);
  }

  await promisify(multi.exec).bind(multi)();
};

const serviceAccount = {
  get: async function (client_id) {
    if (typeof client_id !== "string")
      throw new Error("client_id must be a string");
    if (arguments.length !== 1)
      throw new Error("get requires a single argument, client_id");
    const account = await get(keys.serviceAccount(client_id));
    if (!account) return null;
    return JSON.parse(account);
  },
  set: async function (client_id, changes) {
    if (typeof client_id !== "string")
      throw new Error("client_id must be a string");
    if (typeof changes !== "object")
      throw new Error("changes must be an object");
    if (arguments.length !== 2)
      throw new Error("set requires two arguments, client_id and changes");

    const serviceAccountString = await get(keys.serviceAccount(client_id));
    const serviceAccount = serviceAccountString
      ? JSON.parse(serviceAccountString)
      : {};

    for (var i in changes) {
      serviceAccount[i] = changes[i];
    }

    await set(keys.serviceAccount(client_id), JSON.stringify(serviceAccount));

    await sadd(keys.allServiceAccounts, client_id);
  },
  all: async function () {
    if (arguments.length !== 0)
      throw new Error("all does not accept any arguments");
    const client_ids = await smembers(keys.allServiceAccounts);

    if (!client_ids || !client_ids.length) return [];

    const serviceAccounts = await Promise.all(
      client_ids.map(async (id) => {
        const account = await serviceAccount.get(id);
        return { ...account, client_id: id }; // Ensure client_id is included
      })
    );

    return serviceAccounts;
  },
};

const channel = {
  get: async function (channelId) {
    if (typeof channelId !== "string")
      throw new Error("channelId must be a string");
    if (arguments.length !== 1)
      throw new Error("get requires a single argument, channelId");

    const channel = await get(keys.channel(channelId));
    if (!channel) return null;
    return JSON.parse(channel);
  },
  getByFileId: async function (blogID, fileId) {
    if (typeof fileId !== "string") throw new Error("fileId must be a string");
    if (arguments.length !== 2)
      throw new Error("getByFileId requires two arguments, blogID and fileId");

    const channelId = await get(keys.channelByFileId(blogID, fileId));

    if (!channelId) return null;

    return await channel.get(channelId);
  },
  set: async function (channelId, changes) {
    if (typeof channelId !== "string")
      throw new Error("channelId must be a string");
    if (typeof changes !== "object")
      throw new Error("changes must be an object");
    if (arguments.length !== 2)
      throw new Error("set requires two arguments, channelId and changes");

    const key = keys.channel(channelId);

    const channelString = await get(key);
    const channel = channelString ? JSON.parse(channelString) : {};

    if (
      channel.fileId &&
      channel.blogID &&
      changes.fileId &&
      channel.fileId !== changes.fileId
    ) {
      await del(keys.channelByFileId(channel.blogID, channel.fileId));
    }

    for (var i in changes) {
      channel[i] = changes[i];
    }

    if (channel.fileId && channel.blogID) {
      await set(
        keys.channelByFileId(channel.blogID, channel.fileId),
        channelId
      );
    }

    await set(key, JSON.stringify(channel));

    await sadd(keys.allChannels, key);
  },
  drop: async function (channelId) {
    if (typeof channelId !== "string")
      throw new Error("channelId must be a string");
    if (arguments.length !== 1)
      throw new Error("drop requires a single argument, channelId");
    const key = keys.channel(channelId);
    const channelString = (await get(key)) || "{}";
    const channel = JSON.parse(channelString);

    if (channel.fileId && channel.blogID) {
      await del(keys.channelByFileId(channel.blogID, channel.fileId));
    }

    await del(key);
    await srem(keys.allChannels, key);
  },
  processAll: async function (
    callback,
    { batchSize = 100, blogID = null } = {}
  ) {
    if (typeof callback !== "function")
      throw new Error("callback must be a function");

    let cursor = "0"; // Start with the initial cursor.
    do {
      // Perform an SSCAN operation to fetch a batch of channel IDs.
      const [newCursor, channelKeys] = await sscan(
        keys.allChannels,
        cursor,
        "COUNT",
        batchSize
      );
      cursor = newCursor;

      // For each resource ID, fetch the channel data and process it.
      for (let key of channelKeys) {
        const channelDataString = await get(key);
        const channelData = JSON.parse(channelDataString);

        // optionally filter by blogID if provided
        if (blogID && channelData.blogID !== blogID) continue;

        await callback(channelData); // Call the callback with the channel data.
      }
    } while (cursor !== "0"); // Continue until the cursor loops back to "0" (no more data).
  },
};

function folder(folderId) {
  this.key = `clients:google-drive:${folderId}:folder`;
  this.tokenKey = `clients:google-drive:${folderId}:pageToken`;

  this.set = async (id, path) => {
    await hset(this.key, id, path);
  };

  this.get = async (id) => {
    if (id === undefined || id === null) return null;
    return await hget(this.key, id);
  };

  this.getByPath = async (path) => {
    const START_CURSOR = "0";
    let cursor = START_CURSOR;
    let fileId, results;

    const match = (el, index) => index % 2 === 0 && results[index + 1] === path;

    do {
      [cursor, results] = await hscan(this.key, cursor);
      fileId = results.find(match);
    } while (!fileId && cursor !== START_CURSOR);

    return fileId || null;
  };

  this.move = async (id, to) => {
    const START_CURSOR = "0";
    const from = await this.get(id);

    let movedPaths = [];

    if (from === "/" || to === "/")
      throw new Error("Attempt to move to/from root");

    let [cursor, results] = await hscan(this.key, START_CURSOR);

    do {
      const changes = results
        .map((el, i) => {
          if (i % 2 !== 0) return null;
          const path = results[i + 1];
          const modifiedPath =
            path === from || path.indexOf(from + "/") === 0
              ? to + path.slice(from.length)
              : path;
          if (path === modifiedPath) return null;
          movedPaths.push(path);
          movedPaths.push(modifiedPath);
          return { id: el, path: modifiedPath };
        })
        .filter((i) => !!i);

      for (const { id, path } of changes) await this.set(id, path);

      [cursor, results] = await hscan(this.key, cursor);
    } while (cursor !== START_CURSOR);

    return movedPaths;
  };

  this.remove = async (id) => {
    const START_CURSOR = "0";
    const from = await this.get(id);

    if (from === null || from === undefined) return [];

    let removedPaths = [];

    let [cursor, results] = await hscan(this.key, START_CURSOR);

    do {
      const ids = results
        .map((el, i) => {
          if (i % 2 !== 0) return null;

          const path = results[i + 1];

          if (path === from) {
            removedPaths.push(path);
            return el;
          }

          if (from === "/") {
            removedPaths.push(path);
            return el;
          }

          if (path.indexOf(from + "/") === 0) {
            removedPaths.push(path);
            return el;
          }

          return null;
        })
        .filter((i) => i !== null);

      await hdel(this.key, ids);

      [cursor, results] = await hscan(this.key, cursor);
    } while (cursor !== START_CURSOR);

    return removedPaths;
  };

  this.reset = async () => {
    await del(this.key);
    await del(this.tokenKey);
  };

  this.setPageToken = async (token) => {
    await set(this.tokenKey, token);
  };

  this.getPageToken = async () => {
    return await get(this.tokenKey);
  };

  return this;
}

module.exports = {
  serviceAccount: serviceAccount,
  folder: folder,
  channel: channel,
  getAccount,
  setAccount,
  dropAccount,
};
